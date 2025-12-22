import type {Project} from "@/types/types"

export const projects: Project[] = [
    {
        slug: "wesmun",
        title: "WESMUN",
        description: "Official WESMUN dashboard for Model United Nations conferences",
        visitLink: "https://wesmun.com",
        routes: [
            {
                path: "/api/auth/login",
                title: "Login API",
                description: "Handles user authentication and session management",
            },
            {
                path: "/api/events",
                title: "Events API",
                description: "Fetches upcoming conference events and schedules",
            },
            {
                path: "/api/delegates",
                title: "Delegates API",
                description: "Manages delegate registrations and assignments",
            },
        ],
    },
    {
        slug: "portfolio",
        title: "Portfolio Site",
        description: "Personal portfolio website showcasing projects and experience",
        visitLink: "https://example-portfolio.com",
        routes: [
            {
                path: "/",
                title: "Homepage",
                description: "Main landing page with hero section",
            },
            {
                path: "/api/contact",
                title: "Contact API",
                description: "Handles contact form submissions",
            },
            {
                path: "/api/projects",
                title: "Projects API",
                description: "Fetches portfolio projects data",
            },
        ],
    },
    {
        slug: "ecommerce",
        title: "E-Commerce Platform",
        description: "Full-featured online store with payment processing",
        visitLink: "https://shop-example.com",
        routes: [
            {
                path: "/api/products",
                title: "Products API",
                description: "Retrieves product catalog and details",
            },
            {
                path: "/api/cart",
                title: "Cart API",
                description: "Manages shopping cart operations",
            },
            {
                path: "/api/checkout",
                title: "Checkout API",
                description: "Processes order checkout and payments",
            },
        ],
    },
]
