// Port of "Cubescape" by Inigo Quilez — https://www.shadertoy.com/view/Msl3Rr

import { ImageShader, Skia, useImage } from "@shopify/react-native-skia";
import { useMemo } from "react";

import { type ShaderDefinition, ShaderSurface } from "@/visualizer/shaders/ShaderSurface";

import type { VisualizerComponentProps, VisualizerPresetDefinition } from "./types";

const woodTextureSource = require("./wood.png");

const CUBESCAPE_SHADER = `
// Shader Inputs
// uniform vec3      iResolution;
// uniform float     iTime;
// uniform float     iTimeDelta;
// uniform float     iFrameRate;
// uniform int       iFrame;
// uniform float     iChannelTime[4];
// uniform vec3      iChannelResolution[4];
// uniform vec4      iMouse;
// uniform samplerXX iChannel0..3;
// uniform vec4      iDate;
// uniform float     iSampleRate;

uniform float2 u_resolution;
uniform float u_time;
uniform float u_amplitude;
uniform int u_binCount;
uniform float u_bins[128];
uniform shader u_woodTexture;

const int CHANNEL_AUDIO = 0;
const int CHANNEL_ENVIRONMENT = 1;
const int AA = 2;
const float WOOD_TILE_SCALE = 2.7;
const float WOOD_GRAIN_STRENGTH = 0.14;

float clampToUnit(float value) {
    return clamp(value, 0.0, 1.0);
}

int clampIndex(int value) {
    if (u_binCount <= 0) {
        return 0;
    }
    int maxIndex = u_binCount - 1;
    if (maxIndex > 127) {
        maxIndex = 127;
    }
    if (value < 0) {
        return 0;
    }
    if (value > maxIndex) {
        return maxIndex;
    }
    return value;
}

float readAudioBin(int index) {
    if (u_binCount <= 0) {
        return 0.0;
    }
    int resolvedIndex = clampIndex(index);
    float value = 0.0;
    for (int i = 0; i < 128; ++i) {
        if (i >= u_binCount) {
            break;
        }
        if (i == resolvedIndex) {
            value = u_bins[i];
        }
    }
    return clampToUnit(value);
}

float sampleAudioNormalized(float normalized) {
    if (u_binCount <= 1) {
        return readAudioBin(0);
    }

    float scaled = clamp(normalized, 0.0, 1.0) * float(u_binCount - 1);
    int left = clampIndex(int(floor(scaled)));
    int right = clampIndex(left + 1);
    float mixAmount = fract(scaled);
    float leftValue = readAudioBin(left);
    float rightValue = readAudioBin(right);
    return mix(leftValue, rightValue, mixAmount);
}

float sampleAudioBin(int index) {
    return readAudioBin(clampIndex(index));
}

float shapeAudio(float value) {
    float leveled = pow(clamp(value, 0.0, 1.0), 0.9);
    float amplitudeBoost = clamp(0.7 + clamp(u_amplitude, 0.0, 1.2) * 0.6, 0.4, 1.4);
    float boosted = clamp(leveled * amplitudeBoost, 0.0, 0.85);
    return pow(boosted, 0.85);
}

float sampleAudioEnergy(float normalized) {
    if (u_binCount <= 0) {
        return 0.0;
    }
    float raw = sampleAudioNormalized(normalized);
    return shapeAudio(raw);
}

float4 sampleChannel(int channel, float2 uv) {
    if (channel == CHANNEL_AUDIO) {
        float energy = sampleAudioEnergy(uv.x);
        return float4(energy, energy, energy, 1.0);
    }

    float2 p = fract(uv);
    float blend = smoothstep(0.0, 1.0, p.x);
    float3 base = mix(float3(0.08, 0.10, 0.18), float3(0.82, 0.60, 0.46), blend);
    float shimmer = 0.45 + 0.55 * sin((uv.x + uv.y) * 6.2831 + u_time * 0.15);
    float3 color = clamp(base * shimmer, float3(0.0, 0.0, 0.0), float3(1.0, 1.0, 1.0));
    return float4(color, 1.0);
}

float4 sampleWoodTexture(float2 uv) {
    float2 scaled = float2(uv.x * WOOD_TILE_SCALE, uv.y * (WOOD_TILE_SCALE * 0.65));
    return float4(u_woodTexture.eval(scaled));
}

float3 sampleCube(float3 p, float3 n) {
    float3 weights = max(n * n, float3(1e-3, 1e-3, 1e-3));
    float denom = weights.x + weights.y + weights.z;

    float2 uvX = float2(p.y, p.z);
    float2 uvY = float2(p.x, p.z);
    float2 uvZ = float2(p.x, p.y);

    float3 sampleX = sampleWoodTexture(uvX).xyz;
    float3 sampleY = sampleWoodTexture(uvY).xyz;
    float3 sampleZ = sampleWoodTexture(uvZ).xyz;

    float3 combined = (sampleX * weights.x + sampleY * weights.y + sampleZ * weights.z) / denom;
    float grain = sin(6.2831 * (p.y * 0.35 + p.x * 0.15));
    combined *= 0.92 + WOOD_GRAIN_STRENGTH * grain;

    return clamp(combined, float3(0.02, 0.02, 0.02), float3(1.2, 1.2, 1.2));
}

float hash(float n) {
    return fract(sin(n) * 13.5453123);
}

float maxcomp(float3 v) {
    return max(max(v.x, v.y), v.z);
}

float udBox(float3 p, float3 b, float r) {
    return length(max(abs(p) - b, 0.0)) - r;
}

float freqs[4];

float3 mapH(float2 pos) {
    float2 ipos = floor(pos);

    float f = 0.0;
    float id = hash(ipos.x + ipos.y * 57.0);
    f += freqs[0] * clamp(1.0 - abs(id - 0.20) / 0.30, 0.0, 1.0);
    f += freqs[1] * clamp(1.0 - abs(id - 0.40) / 0.30, 0.0, 1.0);
    f += freqs[2] * clamp(1.0 - abs(id - 0.60) / 0.30, 0.0, 1.0);
    f += freqs[3] * clamp(1.0 - abs(id - 0.80) / 0.30, 0.0, 1.0);

    float raw = clamp(f * 0.55, 0.0, 1.0);
    float shaped = pow(raw, 1.35);
    float h = 1.95 * shaped + 0.35 * raw;

    return float3(h, id, shaped);
}

float3 map(float3 pos) {
    float2 p = fract(pos.xz);
    float3 m = mapH(pos.xz);
    float d = udBox(float3(p.x - 0.5, pos.y - 0.5 * m.x, p.y - 0.5), float3(0.3, m.x * 0.5, 0.3), 0.1);
    return float3(d, m.yz);
}

const float SURFACE = 0.001;

float3 trace(float3 ro, float3 rd, float tmin, float tmax) {
    ro += tmin * rd;

    float2 pos = floor(ro.xz);
    float3 rdi = 1.0 / rd;
    float3 rda = abs(rdi);
    float2 rds = sign(rd.xz);
    float2 dis = (pos - ro.xz + 0.5 + rds * 0.5) * rdi.xz;

    float3 res = float3(-1.0, -1.0, -1.0);

    float2 mm = float2(0.0);
    for (int i = 0; i < 28; i++) {
        float3 cub = mapH(pos);

        float2 pr = pos + 0.5 - ro.xz;
        float2 mini = (pr - 0.5 * rds) * rdi.xz;
        float s = max(mini.x, mini.y);
        if ((tmin + s) > tmax) {
            break;
        }

        float3 ce = float3(pos.x + 0.5, 0.5 * cub.x, pos.y + 0.5);
        float3 rb = float3(0.3, cub.x * 0.5, 0.3);
        float3 ra = rb + 0.12;
        float3 rc = ro - ce;
        float tN = maxcomp(-rdi * rc - rda * ra);
        float tF = maxcomp(-rdi * rc + rda * ra);
        if (tN < tF) {
            float march = tN;
            float h = 1.0;
            for (int j = 0; j < 24; j++) {
                h = udBox(rc + march * rd, rb, 0.1);
                march += h;
                if (march > tF) {
                    break;
                }
            }

            if (h < (SURFACE * march * 2.0)) {
                res = float3(march, cub.yz);
                break;
            }
        }

        float2 disSwapped = float2(dis.y, dis.x);
        mm = step(dis, disSwapped);
        dis += mm * float2(rda.x, rda.z);
        pos += mm * rds;
    }

    res.x += tmin;

    return res;
}

float usmoothstep(float x) {
    x = clamp(x, 0.0, 1.0);
    return x * x * (3.0 - 2.0 * x);
}

float softshadow(float3 ro, float3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 50; i++) {
        float h = map(ro + rd * t).x;
        res = min(res, usmoothstep(k * h / t));
        t += clamp(h, 0.05, 0.2);
        if (res < 0.001 || t > maxt) {
            break;
        }
    }
    return clamp(res, 0.0, 1.0);
}

float3 calcNormal(float3 pos, float t) {
    float2 e = float2(1.0, -1.0) * SURFACE * t;
    float3 offset1 = float3(e.x, e.y, e.y);
    float3 offset2 = float3(e.y, e.y, e.x);
    float3 offset3 = float3(e.y, e.x, e.y);
    float3 offset4 = float3(e.x, e.x, e.x);
    float3 n = offset1 * map(pos + offset1).x +
        offset2 * map(pos + offset2).x +
        offset3 * map(pos + offset3).x +
        offset4 * map(pos + offset4).x;
    return normalize(n);
}

const float3 LIGHT1 = float3(0.70, 0.52, -0.45);
const float3 LIGHT2 = float3(-0.71, 0.0, 0.71);
const float3 LPOS = 6.0 * LIGHT1;

float2 boundingVolume(float2 tminmax, float3 ro, float3 rd) {
    float bp = 2.7;
    float tp = (bp - ro.y) / rd.y;
    if (tp > 0.0) {
        if (ro.y > bp) {
            tminmax.x = max(tminmax.x, tp);
        } else {
            tminmax.y = min(tminmax.y, tp);
        }
    }
    bp = 0.0;
    tp = (bp - ro.y) / rd.y;
    if (tp > 0.0) {
        if (ro.y > bp) {
            tminmax.y = min(tminmax.y, tp);
        }
    }
    return tminmax;
}

float3 doLighting(float3 col, float ks, float3 pos, float3 nor, float3 rd) {
    float3 ldif = LPOS - pos;
    float llen = length(ldif);
    ldif /= llen;
    float con = dot(LIGHT1, ldif);
    float occ = mix(clamp(pos.y / 4.0, 0.0, 1.0), 1.0, 0.2 * max(0.0, nor.y));
    float2 sminmax = float2(0.01, 5.0);

    float sha = softshadow(pos, ldif, sminmax.x, sminmax.y, 32.0);

    float bb = smoothstep(0.5, 0.8, con);
    float lkey = clamp(dot(nor, ldif), 0.0, 1.0);
    float3 lkat = float3(1.0, 1.0, 1.0);
    lkat *= float3(bb * bb * 0.6 + 0.4 * bb, bb * 0.5 + 0.5 * bb * bb, bb).zyx;
    lkat /= 1.0 + 0.25 * llen * llen;
    lkat *= 30.0;
    lkat *= float3(sha, 0.6 * sha + 0.4 * sha * sha, 0.3 * sha + 0.7 * sha * sha);

    float lbac = clamp(0.5 + 0.5 * dot(LIGHT2, nor), 0.0, 1.0);
    lbac *= smoothstep(0.0, 0.8, con);
    lbac /= 1.0 + 0.2 * llen * llen;
    lbac *= 7.0;
    float lamb = 1.0 - 0.5 * nor.y;
    lamb *= 1.0 - smoothstep(10.0, 25.0, length(pos.xz));
    lamb *= 0.25 + 0.75 * smoothstep(0.0, 0.8, con);
    lamb *= 0.25;

    float3 lin = float3(1.60, 0.70, 0.30) * lkey * lkat * (0.5 + 0.5 * occ);
    lin += float3(0.20, 0.05, 0.02) * lamb * occ * occ;
    lin += float3(0.70, 0.20, 0.08) * lbac * occ * occ;
    lin *= float3(1.3, 1.1, 1.0);

    col *= lin;

    float3 hal = normalize(ldif - rd);
    float3 spe = lkey * lkat * (0.5 + 0.5 * occ) * 5.0 *
        pow(clamp(dot(hal, nor), 0.0, 1.0), 6.0 + 6.0 * ks) *
        (0.04 + 0.96 * pow(clamp(1.0 - dot(hal, ldif), 0.0, 1.0), 5.0));

    col += (0.4 + 0.6 * ks) * spe * float3(0.8, 0.9, 1.0);

    col = 1.4 * col / (float3(1.0, 1.0, 1.0) + col);

    return col;
}

float3x3 setLookAt(float3 ro, float3 ta, float cr) {
    float3 cw = normalize(ta - ro);
    float3 cp = float3(sin(cr), cos(cr), 0.0);
    float3 cu = normalize(cross(cw, cp));
    float3 cv = normalize(cross(cu, cw));
    return float3x3(cu, cv, cw);
}

float3 render(float3 ro, float3 rd) {
    float3 col = float3(0.0, 0.0, 0.0);

    float2 tminmax = float2(0.0, 40.0);

    tminmax = boundingVolume(tminmax, ro, rd);

    float3 res = trace(ro, rd, tminmax.x, tminmax.y);
    if (res.y > -0.5) {
        float t = res.x;
        float3 pos = ro + t * rd;
        float3 nor = calcNormal(pos, t);

        float3 woodSample = sampleCube(0.24 * float3(pos.x, 4.0 * res.z - pos.y, pos.z), nor);
        float3 accent = 0.55 + 0.45 * cos(6.2831 * (res.y + float3(0.0, 0.35, 0.7)));
        col = mix(woodSample, woodSample * accent, 0.32);

        float textureLuma = clamp(maxcomp(woodSample), 0.05, 1.2);
        float ks = 1.1 + pow(textureLuma, 4.0) * 2.6;
        col = doLighting(col, ks, pos, nor, rd);
        col *= 0.9 + 0.3 * clamp(u_amplitude, 0.0, 1.0);
        col *= 1.0 - smoothstep(20.0, 40.0, t);
    }
    return col;
}

float3 renderSample(float2 fragCoord, float2 offset, float time, float2 resolution) {
    float2 sampleCoord = fragCoord + offset;
    float2 flippedCoord = float2(sampleCoord.x, resolution.y - sampleCoord.y);
    float2 xy = (-resolution + 2.0 * flippedCoord) / resolution.y;

    float3 ro = float3(
        8.5 * cos(0.2 + 0.33 * time),
        5.0 + 2.0 * cos(0.1 * time),
        8.5 * sin(0.1 + 0.37 * time)
    );
    float3 ta = float3(
        -2.5 + 3.0 * cos(1.2 + 0.41 * time),
        0.0,
        2.0 + 3.0 * sin(2.0 + 0.38 * time)
    );
    float roll = 0.2 * sin(0.1 * time);

    float3x3 ca = setLookAt(ro, ta, roll);
    float3 rd = normalize(ca * float3(xy, 1.75));

    float3 col = render(ro, rd);
    col = pow(col, float3(0.4545));
    col = pow(col, float3(0.8, 0.93, 1.0));
    return col;
}

float4 mainImage(float2 fragCoord) {
    if (u_resolution.x <= 0.0 || u_resolution.y <= 0.0) {
        return float4(0.0, 0.0, 0.0, 1.0);
    }

    freqs[0] = sampleAudioEnergy(0.01);
    freqs[1] = sampleAudioEnergy(0.07);
    freqs[2] = sampleAudioEnergy(0.15);
    freqs[3] = sampleAudioEnergy(0.30);

    float time = 5.0 + 0.2 * u_time;

    float2 resolution = u_resolution;

    float3 tot = float3(0.0, 0.0, 0.0);
    if (AA > 1) {
        for (int j = 0; j < AA; j++) {
            for (int i = 0; i < AA; i++) {
                float2 off = float2(float(i), float(j)) / float(AA);
                tot += renderSample(fragCoord, off, time, resolution);
            }
        }
        tot /= float(AA * AA);
    } else {
        tot = renderSample(fragCoord, float2(0.0, 0.0), time, resolution);
    }

    float2 q = fragCoord / u_resolution;
    float vignette = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.1);
    tot *= 0.2 + 0.8 * vignette;

    return float4(tot, 1.0);
}

half4 main(float2 fragCoord) {
    float4 color = mainImage(fragCoord);
    return half4(color);
}
`;

const CUBESCAPE_DEFINITION: ShaderDefinition = {
    shader: CUBESCAPE_SHADER,
    audioConfig: {
        binCount: 96,
        smoothing: 0.58,
        throttleMs: 18,
    },
};

const CubescapeVisualizer = ({ style, binCountOverride }: VisualizerComponentProps) => {
    const woodTexture = useImage(woodTextureSource);
    const fallbackTexture = useMemo(() => {
        const surface = Skia.Surface.Make(4, 4);
        if (!surface) {
            return null;
        }
        const canvas = surface.getCanvas();
        canvas.clear(Skia.Color("#8b5a3c"));
        const paint = Skia.Paint();
        paint.setColor(Skia.Color("#c7915c"));
        paint.setStrokeWidth(1);
        paint.setAntiAlias(true);
        canvas.drawRect(Skia.XYWHRect(0, 1, 4, 1), paint);
        canvas.drawRect(Skia.XYWHRect(0, 3, 4, 1), paint);
        return surface.makeImageSnapshot();
    }, []);
    const resolvedTexture = woodTexture ?? fallbackTexture;

    const shaderChildren = useMemo(
        () =>
            resolvedTexture ? (
                <ImageShader
                    image={resolvedTexture}
                    fit="fill"
                    tx="repeat"
                    ty="repeat"
                    rect={{ x: 0, y: 0, width: 1, height: 1 }}
                />
            ) : null,
        [resolvedTexture],
    );

    if (!resolvedTexture) {
        return null;
    }

    return (
        <ShaderSurface
            definition={CUBESCAPE_DEFINITION}
            style={style}
            binCountOverride={binCountOverride}
            shaderChildren={shaderChildren}
        />
    );
};

export const cubescapePreset: VisualizerPresetDefinition = {
    id: "cubescape",
    name: "Cubescape",
    Component: CubescapeVisualizer,
};
