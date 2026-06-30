import {
  BookOpen,
  Coins,
  FileText,
  LayoutDashboard,
  Map,
  Milestone,
  PenSquare,
  ScrollText,
  Settings,
  Users
} from "lucide-react";
import type { NavItem } from "@/shared/types";

export const globalNavItems: NavItem[] = [
  {
    path: "/",
    label: "工作台",
    description: "项目概览与开发入口",
    icon: LayoutDashboard,
    status: "in_progress"
  },
  {
    path: "/books",
    label: "作品管理",
    description: "作品列表与书内工作区入口",
    icon: BookOpen,
    status: "implemented"
  },
  {
    path: "/settings",
    label: "系统设置",
    description: "模型、存储与环境配置",
    icon: Settings,
    status: "implemented"
  }
];

export const bookWorkspaceNavItems: NavItem[] = [
  {
    path: "backstories",
    label: "背景故事",
    description: "世界观、历史与设定底稿",
    icon: BookOpen,
    status: "implemented"
  },
  {
    path: "maps",
    label: "地图系统",
    description: "大地图、小地图与事件标注",
    icon: Map,
    status: "implemented"
  },
  {
    path: "timeline",
    label: "时间线",
    description: "编年史、事件轴与发展顺序",
    icon: Milestone,
    status: "implemented"
  },
  {
    path: "economy",
    label: "经济系统",
    description: "货币、资源、贸易与财政规则",
    icon: Coins,
    status: "implemented"
  },
  {
    path: "outlines",
    label: "大纲管理",
    description: "总纲、卷纲与章纲骨架",
    icon: ScrollText,
    status: "implemented"
  },
  {
    path: "characters",
    label: "角色管理",
    description: "多维人设与关系网络",
    icon: Users,
    status: "implemented"
  },
  {
    path: "foreshadows",
    label: "伏笔与情节",
    description: "伏笔追踪与桥段规划",
    icon: FileText,
    status: "implemented"
  },
  {
    path: "chapters",
    label: "章节工作台",
    description: "章节目录、编辑区与检查位",
    icon: PenSquare,
    status: "implemented"
  }
];

export const navItems = globalNavItems;

export function getBookWorkspacePath(bookId: number, childPath = "backstories") {
  return `/books/${bookId}/${childPath}`;
}
