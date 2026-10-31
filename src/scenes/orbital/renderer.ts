import { FRAGMENT_SHADER, VERTEX_SHADER } from './shader.ts';
import type { OrbitalFrame } from './camera.ts';

export interface RendererQuality {
  steps: number;
  lightSteps: number;
  /** Device-pixel ceiling for the drawing buffer. */
  maxDpr: number;
}

export const QUALITY = {
  high: { steps: 16, lightSteps: 6, maxDpr: 1.5 },
  low: { steps: 10, lightSteps: 4, maxDpr: 1 },
} satisfies Record<string, RendererQuality>;

const UNIFORMS = [
  'uResolution',
  'uTime',
  'uCamPos',
  'uForward',
  'uRight',
  'uUp',
  'uSun',
  'uTanHalfFov',
  'uExposure',
  'uSunVis',
  'uSunScreen',
  'uLensShift',
  'uCloudDrift',
  'uTextures',
  'uSteps',
  'uLightSteps',
  'uDay',
  'uData',
  'uRegion',
  'uRegionReady',
] as const;

type UniformName = (typeof UNIFORMS)[number];

// Status is queried later (see `ready`) so drivers can compile off the main thread.
function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

type TextureSource = ImageBitmap | HTMLImageElement;

/** Decodes off the main thread where possible, so uploads never stall a frame. */
async function loadImage(src: string): Promise<TextureSource> {
  if ('createImageBitmap' in window) {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Could not load ${src}`);
      return await createImageBitmap(await response.blob(), {
        imageOrientation: 'none',
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
    } catch {
      // Fall through to an element decode.
    }
  }
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export class OrbitalRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private uniforms = {} as Record<UniformName, WebGLUniformLocation | null>;
  private textures: WebGLTexture[] = [];
  private texturesReady = 0;
  private regionReady = 0;
  private anisotropy: number;
  private anisotropyExt: EXT_texture_filter_anisotropic | null;
  private width = 0;
  private height = 0;
  private disposed = false;
  private shaders: WebGLShader[] = [];
  private parallel: object | null = null;
  private linked = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private quality: RendererQuality
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    // Enabled before compiling so the driver may link in the background.
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    const program = gl.createProgram();
    if (!program) throw new Error('Could not create program');
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    this.program = program;
    this.shaders = [vs, fs];

    // One oversized triangle covers the viewport without a diagonal seam.
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!buffer || !vao) throw new Error('Could not allocate geometry');
    this.buffer = buffer;
    this.vao = vao;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.anisotropyExt = gl.getExtension('EXT_texture_filter_anisotropic');
    this.anisotropy = this.anisotropyExt
      ? Math.min(8, gl.getParameter(this.anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
      : 1;

    // Placeholder 1×1 textures so the first frames render before images arrive.
    this.textures = [
      this.createTexture(true),
      this.createTexture(false),
      this.createTexture(false),
    ];
  }

  private createTexture(srgb: boolean) {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([4, 8, 14, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  /** Resolves once the program has linked, polling instead of blocking when possible. */
  async ready() {
    const gl = this.gl;
    const COMPLETION_STATUS_KHR = 0x91b1;
    if (this.parallel)
      while (!this.disposed && !gl.getProgramParameter(this.program, COMPLETION_STATUS_KHR))
        await nextFrame();
    if (this.disposed) return;
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const log = this.shaders.map(shader => gl.getShaderInfoLog(shader)).join('\n');
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(this.program)} ${log}`);
    }
    this.shaders.forEach(shader => gl.deleteShader(shader));
    this.shaders = [];
    // Uniform queries wait for the link, so they only happen once it has finished.
    UNIFORMS.forEach(name => (this.uniforms[name] = gl.getUniformLocation(this.program, name)));
    this.linked = true;
  }

  private upload(texture: WebGLTexture, image: TextureSource, srgb: boolean, repeat = true) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.anisotropyExt)
      gl.texParameterf(
        gl.TEXTURE_2D,
        this.anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT,
        this.anisotropy
      );
  }

  async loadTextures(day: string, data: string, region?: string) {
    const [dayImage, dataImage] = await Promise.all([loadImage(day), loadImage(data)]);
    if (this.disposed) return;
    // One upload per frame keeps each frame's GPU work small.
    this.upload(this.textures[0], dayImage, true);
    await nextFrame();
    if (this.disposed) return;
    this.upload(this.textures[1], dataImage, false);
    this.texturesReady = 1;
    if (!region) return;
    const regionImage = await loadImage(region);
    await nextFrame();
    if (this.disposed) return;
    this.upload(this.textures[2], regionImage, false, false);
    this.regionReady = 1;
  }

  get hasTextures() {
    return this.texturesReady > 0;
  }

  /** Sizes the drawing buffer; `scale` lets the caller trade resolution for speed. */
  resize(cssWidth: number, cssHeight: number, scale: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.maxDpr) * scale;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(frame: OrbitalFrame, time: number, textureMix: number, cloudDrift: number) {
    if (this.disposed || !this.linked) return;
    const gl = this.gl;
    const u = this.uniforms;
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.program);
    gl.uniform2f(u.uResolution, this.width, this.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform3fv(u.uCamPos, frame.position);
    gl.uniform3fv(u.uForward, frame.forward);
    gl.uniform3fv(u.uRight, frame.right);
    gl.uniform3fv(u.uUp, frame.up);
    gl.uniform3fv(u.uSun, frame.sun);
    gl.uniform1f(u.uTanHalfFov, frame.tanHalfFov);
    gl.uniform1f(u.uExposure, frame.exposure);
    gl.uniform1f(u.uSunVis, frame.sunVisibility);
    gl.uniform2f(u.uSunScreen, frame.sunScreen[0], frame.sunScreen[1]);
    gl.uniform2f(u.uLensShift, frame.lensShift[0], frame.lensShift[1]);
    gl.uniform1f(u.uCloudDrift, cloudDrift);
    gl.uniform1f(u.uTextures, this.texturesReady * textureMix);
    gl.uniform1i(u.uSteps, this.quality.steps);
    gl.uniform1i(u.uLightSteps, this.quality.lightSteps);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.uniform1i(u.uDay, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.uniform1i(u.uData, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[2]);
    gl.uniform1i(u.uRegion, 2);
    gl.uniform1f(u.uRegionReady, this.regionReady);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  isContextLost() {
    return this.gl.isContextLost();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;
    this.textures.forEach(texture => gl.deleteTexture(texture));
    this.shaders.forEach(shader => gl.deleteShader(shader));
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
