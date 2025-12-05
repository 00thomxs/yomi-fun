declare module 'dom-to-image-more' {
  interface Options {
    bgcolor?: string
    width?: number
    height?: number
    quality?: number
    scale?: number
    style?: object
    filter?: (node: Node) => boolean
    cacheBust?: boolean
  }

  function toSvg(node: Node, options?: Options): Promise<string>
  function toPng(node: Node, options?: Options): Promise<string>
  function toJpeg(node: Node, options?: Options): Promise<string>
  function toBlob(node: Node, options?: Options): Promise<Blob>
  function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>

  export { toSvg, toPng, toJpeg, toBlob, toPixelData }
  export default { toSvg, toPng, toJpeg, toBlob, toPixelData }
}

