import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md">
            <div className="flex h-16 max-w-7xl mx-auto px-6 items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9"> 
                        <img src="logo.svg" alt="Craft AI Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-semibold text-lg tracking-tight">Craft AI</span>
                </div>
                <div className="flex items-center gap-2">
                    <SignedOut>
                        <SignInButton mode="modal"> 
                            <Button variant="outline">Login</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button>Get Started</Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </div>
        </div>
    )
}