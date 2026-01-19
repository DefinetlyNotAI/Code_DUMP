import DeploymentInfo from "@/components/deployement-info";

export function Footer() {
    return (
        <footer className="bg-card border-t border-border">
            <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} WESMUN. All rights reserved.</p>
                <DeploymentInfo/>
            </div>
        </footer>
    )
}
