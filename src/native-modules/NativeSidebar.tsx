import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import { requireNativeComponent, type ViewProps } from "react-native";

export interface NativeSidebarItem {
    id: string;
    label: string;
}

export interface NativeSidebarViewProps extends ViewProps {
    items?: NativeSidebarItem[];
    selectedId?: string;
    contentInsetTop?: number;
    onSidebarSelectionChange?: (event: { nativeEvent: { id: string } }) => void;
    children?: ReactNode;
}

const NativeSidebarView = requireNativeComponent<NativeSidebarViewProps>("LMSidebar");

cssInterop(NativeSidebarView, {
    className: "style",
});

export { NativeSidebarView };

// SidebarItem - wrapper for custom RN content in sidebar rows
export interface SidebarItemViewProps extends ViewProps {
    itemId: string;
    selectable?: boolean;
    /** Row height for this item (default: 28) */
    rowHeight?: number;
    children?: ReactNode;
}

const NativeSidebarItemView = requireNativeComponent<SidebarItemViewProps>("LMSidebarItem");

cssInterop(NativeSidebarItemView, {
    className: "style",
});

export { NativeSidebarItemView };
