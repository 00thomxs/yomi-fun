-- =====================================================
-- ATOMIC COSMETIC PURCHASE FUNCTION
-- =====================================================
-- This function handles cosmetic purchases atomically,
-- ensuring balance deduction and cosmetic ownership are
-- committed together or rolled back together.

CREATE OR REPLACE FUNCTION public.purchase_cosmetic(
  p_user_id UUID,
  p_cosmetic_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_user_balance INTEGER;
  v_new_balance INTEGER;
  v_already_owned BOOLEAN;
BEGIN
  -- 1. Get cosmetic item details
  SELECT id, name, price, is_available 
  INTO v_item
  FROM public.cosmetic_items 
  WHERE id = p_cosmetic_id;
  
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cosmétique introuvable');
  END IF;
  
  IF NOT v_item.is_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cosmétique non disponible');
  END IF;
  
  -- 2. Check if already owned
  SELECT EXISTS(
    SELECT 1 FROM public.user_cosmetics 
    WHERE user_id = p_user_id AND cosmetic_id = p_cosmetic_id
  ) INTO v_already_owned;
  
  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous possédez déjà ce cosmétique');
  END IF;
  
  -- 3. Get user balance with row lock to prevent race conditions
  SELECT balance INTO v_user_balance
  FROM public.profiles 
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF v_user_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil introuvable');
  END IF;
  
  IF v_user_balance < v_item.price THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Solde insuffisant. Il vous manque %s Zeny.', (v_item.price - v_user_balance))
    );
  END IF;
  
  -- 4. Atomic transaction: deduct balance AND add cosmetic
  v_new_balance := v_user_balance - v_item.price;
  
  UPDATE public.profiles 
  SET balance = v_new_balance 
  WHERE id = p_user_id;
  
  INSERT INTO public.user_cosmetics (user_id, cosmetic_id, price_paid)
  VALUES (p_user_id, p_cosmetic_id, v_item.price);
  
  -- 5. Log transaction (optional, non-blocking)
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'shop_purchase', -v_item.price, 'Achat cosmétique: ' || v_item.name);
  
  RETURN jsonb_build_object(
    'success', true, 
    'newBalance', v_new_balance,
    'itemName', v_item.name
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Any error will automatically rollback the entire transaction
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.purchase_cosmetic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_cosmetic(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.purchase_cosmetic IS 'Atomic cosmetic purchase - deducts balance and adds ownership in single transaction';

