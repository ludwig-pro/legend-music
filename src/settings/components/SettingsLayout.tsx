import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";

import { cn } from "@/utils/cn";

interface SettingsPageProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    scroll?: boolean;
    className?: string;
    contentClassName?: string;
}

export function SettingsPage({
    title,
    description,
    actions,
    children,
    scroll = false,
    className,
    contentClassName,
}: SettingsPageProps) {
    const Header = (
        <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
                <Text className="text-2xl font-bold text-text-primary">{title}</Text>
                {description ? <Text className="text-text-tertiary text-base mt-2">{description}</Text> : null}
            </View>
            {actions ? <View className="flex-none ml-4">{actions}</View> : null}
        </View>
    );

    if (scroll) {
        return (
            <View className={cn("flex-1 bg-background-primary", className)}>
                <ScrollView className="flex-1" contentContainerClassName={cn("p-6", contentClassName)}>
                    {Header}
                    {children}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className={cn("flex-1 bg-background-primary", className)}>
            <View className={cn("flex-1 p-6", contentClassName)}>
                {Header}
                {children}
            </View>
        </View>
    );
}

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    cardClassName?: string;
    headerRight?: ReactNode;
    card?: boolean;
}

export function SettingsSection({
    title,
    description,
    children,
    className,
    contentClassName,
    cardClassName,
    headerRight,
    card = true,
}: SettingsSectionProps) {
    const content = contentClassName ? <View className={contentClassName}>{children}</View> : children;

    return (
        <View className={cn("mb-8", className)}>
            <View className="mb-4 flex-row items-start justify-between">
                <View className="flex-1">
                    <Text className="text-lg font-semibold text-text-primary">{title}</Text>
                    {description ? <Text className="text-text-tertiary text-sm mt-1">{description}</Text> : null}
                </View>
                {headerRight ? <View className="flex-none ml-4">{headerRight}</View> : null}
            </View>
            {card ? <SettingsCard className={cn("gap-4", cardClassName)}>{content}</SettingsCard> : content}
        </View>
    );
}

interface SettingsCardProps {
    children: ReactNode;
    className?: string;
}

export function SettingsCard({ children, className }: SettingsCardProps) {
    return (
        <View className={cn("bg-background-secondary rounded-lg border border-border-primary p-4", className)}>
            {children}
        </View>
    );
}

interface SettingsRowProps {
    title: string;
    description?: string;
    control: ReactNode;
    className?: string;
    contentClassName?: string;
    controlWrapperClassName?: string;
    align?: "start" | "center";
    disabled?: boolean;
}

export function SettingsRow({
    title,
    description,
    control,
    className,
    contentClassName,
    controlWrapperClassName,
    align = "start",
    disabled = false,
}: SettingsRowProps) {
    return (
        <View
            className={cn(
                "flex-row justify-between",
                align === "center" ? "items-center" : "items-start",
                disabled ? "opacity-60" : "",
                className,
            )}
        >
            <View className={cn("flex-1 pr-6", contentClassName)}>
                <Text className="text-text-primary text-base font-medium">{title}</Text>
                {description ? <Text className="text-text-tertiary text-sm mt-1">{description}</Text> : null}
            </View>
            <View className={cn("flex-none", controlWrapperClassName)}>{control}</View>
        </View>
    );
}
