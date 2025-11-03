import { SFSymbol } from "@/native-modules/SFSymbol";
import type { SFSymbols } from "@/types/SFSymbols";

interface IconProps {
    name: SFSymbols;
    size: number;
    color?: string;
    marginTop?: number;
}

export function Icon({ name, size, color: colorProp, marginTop }: IconProps) {
    const color = colorProp ?? "white";

    return <SFSymbol name={name} size={size} color={color} style={{ marginTop }} />;
}
