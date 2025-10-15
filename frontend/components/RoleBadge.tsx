"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Shield, Edit, Eye } from "lucide-react";
import type { Role } from "@/hooks/useInvitations";

interface RoleBadgeProps {
  role: Role;
  showTooltip?: boolean;
  className?: string;
}

const roleConfig = {
  OWNER: {
    label: "Owner",
    icon: Crown,
    variant: "default" as const,
    description: "Full control over event, members, and all content",
    color: "text-amber-600 dark:text-amber-400",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    variant: "secondary" as const,
    description: "Manage items, audits, and invite EDITOR/VIEWER roles",
    color: "text-blue-600 dark:text-blue-400",
  },
  EDITOR: {
    label: "Editor",
    icon: Edit,
    variant: "outline" as const,
    description: "Create and edit items and audits",
    color: "text-green-600 dark:text-green-400",
  },
  VIEWER: {
    label: "Viewer",
    icon: Eye,
    variant: "outline" as const,
    description: "Read-only access to event content",
    color: "text-gray-600 dark:text-gray-400",
  },
};

export function RoleBadge({ role, showTooltip = true, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  const badgeContent = (
    <Badge variant={config.variant} className={className}>
      <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
