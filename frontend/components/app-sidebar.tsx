"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ChevronRight,
  ClockIcon,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-context"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { title: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { title: "Profile",       href: "/profile",       icon: User            },
  { title: "Mood Tracking", href: "/mood-tracking", icon: BarChart3       },
  { title: "History",       href: "/history",       icon: ClockIcon       },
  { title: "Consultants",   href: "/consultants",   icon: Stethoscope     },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-orange-100/60 bg-white">
      <SidebarHeader className="border-b border-orange-100/60 px-4 py-4">
  <Link href="/" className={cn(
    "flex items-center gap-3 px-1 py-1 rounded-xl hover:bg-orange-50/60 transition-colors",
    isCollapsed && "justify-center gap-0"
  )}>

    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.44-4.44 3 3 0 0 1-1.09-5.13A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.44-4.44 3 3 0 0 0 1.09-5.13A2.5 2.5 0 0 0 14.5 2Z" />
      </svg>
    </div>


    {!isCollapsed && (
      <span className="bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-[18px] font-bold tracking-tight text-transparent">
        MoodSphere
      </span>
    )}
  </Link>
</SidebarHeader>


      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-orange-400/70">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    className={cn(
                      "group h-10 rounded-xl border text-sm font-medium transition-all duration-150",
                      isCollapsed && "justify-center",
                      active
                        ? "border-orange-200 bg-linear-to-r from-orange-50 to-orange-100/60 text-orange-600 shadow-sm shadow-orange-100"
                        : "border-transparent text-neutral-500 hover:border-orange-100 hover:bg-orange-50/50 hover:text-orange-600"
                    )}
                    render={(props) => (
                      <Link {...props} href={item.href} className={cn(
                        props.className, 
                        "flex items-center px-1",
                        isCollapsed ? "justify-center px-0" : "justify-between gap-3"
                      )}>
                        <span className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-orange-500" : "text-neutral-400 group-hover:text-orange-400")} />
                          {!isCollapsed && <span>{item.title}</span>}
                        </span>
                        {!isCollapsed && (
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-opacity",
                              active ? "text-orange-400 opacity-100" : "opacity-0 group-hover:opacity-40"
                            )}
                          />
                        )}
                      </Link>
                    )}
                  />
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-orange-100/60 p-3">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={user?.email ?? "Account"}
              className={cn(
                "h-auto rounded-xl border border-orange-100 bg-linear-to-br from-orange-50 to-orange-100/40 px-3 py-2.5 hover:from-orange-100 hover:to-orange-50",
                isCollapsed && "p-1.5 justify-center"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-sm">
                <User className="h-3.5 w-3.5" />
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col leading-none">
                  <span className="truncate text-sm font-semibold text-neutral-800">
                    {user?.name ?? "Guest"}
                  </span>
                  <span className="truncate text-[11px] text-neutral-400">
                    {user?.email ?? ""}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>


          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={logout}
              className={cn(
                "h-9 rounded-xl border border-transparent text-sm font-medium text-neutral-400 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-500",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}