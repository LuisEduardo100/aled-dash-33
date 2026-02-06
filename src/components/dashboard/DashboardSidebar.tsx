import { LayoutDashboard, Users, BarChart4, Sun, Moon, Trophy, DollarSign, TrendingUp } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/components/ThemeProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const menuItems = [
  { title: 'Dashboard de Leads', url: '/', icon: Users },
  { title: 'Dashboard de Negócios', url: '/deals-dashboard', icon: DollarSign },
  { title: 'Geração de Demanda', url: '/demand-generation', icon: BarChart4 },
  { title: 'Análise de Negócios', url: '/created-deals', icon: TrendingUp },
  { title: 'Performance Vendas', url: '/sales-performance', icon: Trophy },
  { title: 'Lista de Leads Avançada', url: '/advanced-leads', icon: Users },
  { title: 'Relatório de Conversão', url: '/lead-conversion', icon: BarChart4 },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white shrink-0">
              <img src="/aled_atacadaoled_logo.jfif" alt="Aled Logo" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col fade-in animate-in duration-300">
                <span className="font-semibold text-foreground leading-tight truncate">Dashboard Aled</span>
                <span className="text-[10px] text-muted-foreground truncate">Dados do CRM Bitrix24</span>
              </div>
            )}
          </div>
          <SidebarTrigger className="hidden md:flex" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {!isCollapsed && 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <div onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
