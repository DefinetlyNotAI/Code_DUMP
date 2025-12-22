import {notFound} from "next/navigation"
import Link from "next/link"
import {projects} from "@/lib/projectData"
import {getRouteStatus} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {CollapsibleRoute} from "@/components/collapsible-route"
import AutoChecker from "@/components/auto-checker"
import DevControls from "@/components/dev-controls"
import {ArrowLeft, ExternalLink} from "lucide-react"

interface ProjectPageProps {
    params: Promise<{ project: string }>
}

export default async function ProjectPage({params}: ProjectPageProps) {
    const {project: projectSlug} = await params
    const project = projects.find((p) => p.slug === projectSlug)

    if (!project) {
        notFound()
    }

    const routeStatuses = await Promise.all(
        project.routes.map((route) => getRouteStatus(projectSlug, route))
    )

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5"/>
                            </Link>
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                            <p className="text-muted-foreground mt-1">{project.description}</p>
                        </div>
                        <Button variant="outline" asChild>
                            <a href={project.visitLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4"/>
                                Visit Site
                            </a>
                        </Button>
                    </div>

                    {/* Dev-only controls (Delete all / Check All) */}
                    <DevControls projectSlug={projectSlug} routes={project.routes.map((r) => r.path)} />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Auto-checker runs client-side when lastChecked >= 45 minutes */}
                <AutoChecker routes={routeStatuses.map((r) => ({projectSlug, path: r.path, lastChecked: r.lastChecked ? new Date(r.lastChecked).toISOString() : null}))} />

                <div className="space-y-4">
                    {routeStatuses.map((route) => (
                        <CollapsibleRoute key={route.path} route={route} projectSlug={projectSlug}/>
                    ))}
                </div>
            </main>
        </div>
    )
}
