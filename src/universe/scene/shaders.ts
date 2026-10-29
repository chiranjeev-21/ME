export const surfaceVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPosition = position;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec3 p) {
    p = fract(p * .3183099 + vec3(.1, .2, .3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                   mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                   mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    vec3 p = vPosition * 3.3 + vec3(0., uTime * .045, 0.);
    float grain = noise(p) * .55 + noise(p * 2.9) * .30 + noise(p * 8.1) * .15;
    float edge = pow(max(0., dot(normalize(vNormal), normalize(vView))), .35);
    vec3 color = mix(vec3(.71,.22,.038), vec3(1.,.91,.65), grain * 1.12);
    color *= .72 + edge * .48;
    gl_FragColor = vec4(color, 1.);
  }
`;

export const coronaFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float rim = pow(1. - facing, 3.4);
    float flow = sin(atan(vPosition.y, vPosition.x) * 29. + uTime * .14
                     + sin(vPosition.z * 17. + uTime * .08) * 1.8);
    float alpha = rim * (.20 + flow * .045);
    gl_FragColor = vec4(1., .48, .13, alpha);
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1. - abs(dot(normalize(vNormal), normalize(vView))), 3.6);
    float light = .30 + .70 * max(0., dot(normalize(vNormal), normalize(vec3(-.6,.7,1.))));
    gl_FragColor = vec4(uColor, rim * light * .38);
  }
`;
