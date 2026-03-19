import { AppSidebar } from "./app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function SideBar() {
  return (
    <div className="fixed left-0 bottom-0" style={{ top: "50px" }}>
      <SidebarProvider className="!min-h-0 h-full relative">
        <AppSidebar variant="floating" />
        <SidebarInset>
          <div className="absolute top-1 left-4">
            <SidebarTrigger />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
