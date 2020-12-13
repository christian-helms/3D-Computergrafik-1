precision mediump float;

// sample values (=y-values) - samples for one series are stored continuously
uniform float u_samples[$NUM_SERIES_TIMES_SAMPLES$];
// x-positions for samples
uniform float u_samplePositions[$NUM_SAMPLES$];
uniform float u_minSamplePos;
uniform float u_maxSamplePos;
uniform float u_maxSample;

// global const values are known at compile time and won't change
const int c_numSeries = $NUM_SERIES$;
const int c_numSamples = $NUM_SAMPLES$;
const float c_pointEpsilon = 0.004;
const float c_lineEpsilon = 0.001;

layout(location = 0) out vec4 fragColor;

// texture coordinate of current fragment
in vec2 v_uv;

// calculate distance of point p to line through points p1 and p2
float distToLine(vec2 p1, vec2 p2, vec2 p)
{
    vec2 dir = p2 - p1;
    vec2 perpendicular = vec2(dir.y, -dir.x);
    vec2 pDir = p1 - p;
    return abs(dot(normalize(perpendicular), pDir));
}

// fetch value for given series and sample
vec2 getPoint(int seriesIndex, int sampleIndex)
{
    float x = u_samplePositions[sampleIndex];
    float y = u_samples[seriesIndex * c_numSamples + sampleIndex];
    return vec2(x, y);
}

// convert hsl (hue-saturation-lightness) color to rgb
vec3 hsl2rgb(vec3 c)
{
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

float x2u(float x)
{
    return (x - u_minSamplePos) / (u_maxSamplePos - u_minSamplePos);
}

float y2v(float y)
{
    return y / u_maxSample;
}

vec2 pos2uv(vec2 pos)
{
    return vec2(x2u(pos.x), y2v(pos.y));
}

void main(void)
{
    // find closest sample positions in upper and lower direction
    // only lower has to be stored, since upper = lower+1
    float previousSampleIndexAsFloat;
    for(int i = 0; i < c_numSamples - 1; ++i)
    {
        // fetch x pos of samples i and i+1
        float lowerPos = x2u(u_samplePositions[i]);
        float upperPos = x2u(u_samplePositions[i + 1]);
        // check if fragment's x is between - step is equal to a < b ? 1 : 0
        float lowerCheck = step(lowerPos, v_uv.x);
        float upperCheck = step(v_uv.x, upperPos);
        // multiply -> 1 if both checks are 1
        float between = lowerCheck * upperCheck;
        // assign new value if checks are 1
        previousSampleIndexAsFloat = mix(
            previousSampleIndexAsFloat, float(i), between);
    }
    int previousSampleIndex = int(previousSampleIndexAsFloat);

    // calculate dist of fragment to each series measurements and lines
    // between them, store closest config and its distance
    float closestPointDist = 1.0;
    float closestPointDistIndex;
    float closestLineDist = 1.0;
    float closestLineDistIndex;
    for(int i = 0; i < c_numSeries; ++i)
    {
        // get left and right sample point
        vec2 p1 = pos2uv(getPoint(i, previousSampleIndex));
        vec2 p2 = pos2uv(getPoint(i, previousSampleIndex + 1));

        // calculate distance from fragment to left and right sample
        float leftPointDist = length(v_uv - p1);
        float rightPointDist = length(v_uv - p2);
        // get min dist of both
        float pointDist = min(leftPointDist, rightPointDist);
        // is 1 if new dist is smaller than previous lowest dist
        float newClosestPoint = step(pointDist, closestPointDist);
        // for storing the smallest dist, just use min
        closestPointDist = min(pointDist, closestPointDist);
        // assign new index if closer-check is 1
        float iAsFloat = float(i);
        closestPointDistIndex = mix(
            closestPointDistIndex, iAsFloat, newClosestPoint);

        // calc dist to line between measurement points
        float lineDist = distToLine(p1, p2, v_uv);
        // is 1 if new dist is smaller than previous lowest dist
        float newClosestLine = step(lineDist, closestLineDist);
        // for storing the smallest dist, just use min
        closestLineDist = min(lineDist, closestLineDist);
        // assign new index if closer-check is 1
        closestLineDistIndex = mix(
            closestLineDistIndex, iAsFloat, newClosestLine);
    }

    // check if fragment is close enough to any point or line
    float pointCheck = step(closestPointDist, c_pointEpsilon);
    float lineCheck = step(closestLineDist, c_lineEpsilon);
    // calculate colors for closest config
    float divisor = float(c_numSeries + 1);
    vec3 pointColor = hsl2rgb(
        vec3(closestPointDistIndex / divisor, 1.0, 0.5));
    vec3 lineColor = hsl2rgb(
        vec3(closestLineDistIndex / divisor, 1.0, 0.5));
    // apply color if close enough
    // point color has precedence and thus is applied after line color
    vec3 color = vec3(0.2);
    color = mix(color, lineColor, lineCheck);
    color = mix(color, pointColor, pointCheck);

    fragColor = vec4(color, 1.0);
}
