import PortalNav from "@/components/ui/PortalNav";
import Footer from "@/components/ui/Footer";

const NAV_LINKS = [
  { href: "/student", label: "My Classes" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg-light" style={{ display: "flex", flexDirection: "column" }}>
      <PortalNav role="student" links={NAV_LINKS} />
      <div className="page-container" style={{ flex: 1 }}>{children}</div>
      <Footer />
    </div>
  );
}
