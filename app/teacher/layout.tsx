import PortalNav from "@/components/ui/PortalNav";

const NAV_LINKS = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/classes", label: "Classes" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg-light">
      <PortalNav role="teacher" links={NAV_LINKS} />
      <div className="page-container">{children}</div>
    </div>
  );
}
