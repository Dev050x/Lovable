import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function NavBar() {
    return (
        <div className="w-full bg-[#000000] h-12.5 flex items-center px-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8">
                        <img src="logo.png" alt="Craft AI Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">CraftAI</span>
                </div>

                <div className="flex items-center gap-2">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="ghost" className="text-white hover:text-black hover:bg-white border text-sm h-8 px-3">
                                Login
                            </Button>
                        </SignInButton>
                        <SignInButton mode="modal">
                            <Button className="bg-white text-black hover:bg-white/90 text-sm h-8 px-3 rounded-md font-medium">
                                Get Started
                            </Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </div>
        </div>
    );
}