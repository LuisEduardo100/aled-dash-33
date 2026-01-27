import React from 'react';

interface GaugeChartProps {
    value: number;
    min?: number;
    max: number;
    label?: string;
    size?: number;
    className?: string;
}

export function GaugeChart({
    value,
    min = 0,
    max,
    label,
    size = 180,
    className = ''
}: GaugeChartProps) {
    // Calculate percentage and ensure it's within bounds
    const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);

    // Arc parameters
    const strokeWidth = size * 0.12;
    const radius = (size - strokeWidth) / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    // Arc spans from -135deg to 135deg (270 degree arc)
    const startAngle = -135;
    const endAngle = 135;
    const totalAngle = endAngle - startAngle;

    // Calculate current angle based on percentage
    const currentAngle = startAngle + (percentage * totalAngle);

    // Convert angle to radians and calculate arc endpoints
    const polarToCartesian = (angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(rad),
            y: centerY + radius * Math.sin(rad)
        };
    };

    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const current = polarToCartesian(currentAngle);

    // SVG arc path
    const largeArcFlag = totalAngle > 180 ? 1 : 0;
    const valueArcFlag = (percentage * totalAngle) > 180 ? 1 : 0;

    // Background arc path
    const bgPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

    // Value arc path
    const valuePath = percentage > 0
        ? `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${valueArcFlag} 1 ${current.x} ${current.y}`
        : '';

    // Format value for display
    const formatValue = (val: number): string => {
        if (val >= 1000000) {
            return `${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
        }
        if (val >= 1000) {
            return `${(val / 1000).toFixed(2).replace('.', ',')} Mil`;
        }
        return val.toFixed(0);
    };

    const formatMax = (val: number): string => {
        if (val >= 1000000) {
            return `${(val / 1000000).toFixed(0)} Mi`;
        }
        if (val >= 1000) {
            return `${(val / 1000).toFixed(0)} Mil`;
        }
        return val.toFixed(0);
    };

    return (
        <div className={`relative inline-flex flex-col items-center ${className}`}>
            <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
                <defs>
                    <linearGradient id={`gaugeGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#86efac" />
                    </linearGradient>
                </defs>

                {/* Background arc */}
                <path
                    d={bgPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="text-muted/30"
                />

                {/* Value arc */}
                {percentage > 0 && (
                    <path
                        d={valuePath}
                        fill="none"
                        stroke={`url(#gaugeGradient-${size})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                )}

                {/* Min label */}
                <text
                    x={start.x - 5}
                    y={start.y + 20}
                    className="fill-muted-foreground text-[10px]"
                    textAnchor="middle"
                >
                    0
                </text>

                {/* Max label */}
                <text
                    x={end.x + 5}
                    y={end.y + 20}
                    className="fill-muted-foreground text-[10px]"
                    textAnchor="middle"
                >
                    {formatMax(max)}
                </text>
            </svg>

            {/* Value display */}
            <div className="absolute bottom-0 text-center">
                <p className="text-xl md:text-2xl font-bold text-foreground">
                    {formatValue(value)}
                </p>
                {label && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {label}
                    </p>
                )}
            </div>
        </div>
    );
}
