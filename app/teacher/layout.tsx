import PortalNav from "@/components/ui/PortalNav";
import Footer from "@/components/ui/Footer";

const NAV_LINKS = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/classes", label: "Classes" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg-light" style={{ display: "flex", flexDirection: "column" }}>
      <PortalNav role="teacher" links={NAV_LINKS} />
      <div className="page-container" style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  );
}
