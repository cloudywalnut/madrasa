import PortalNav from "@/components/ui/PortalNav";

const NAV_LINKS = [
  { href: "/student", label: "My Classes" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg-light">
      <PortalNav role="student" links={NAV_LINKS} />
      <div className="page-container">{children}</div>
    </div>
  );
}
