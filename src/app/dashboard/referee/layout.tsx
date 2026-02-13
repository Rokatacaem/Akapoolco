export default function RefereeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">
            {children}
        </div>
    );
}
