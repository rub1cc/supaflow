import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getPageServerSubscriptions,
  getPageServerUser,
  returnRedirectToApp,
  returnRedirectToLogin,
} from "@/utils/account";
import { cn } from "@/utils/cn";
import config from "@/utils/config";
import { User } from "@supabase/supabase-js";
import { GetServerSidePropsContext } from "next";
import { Libre_Baskerville } from "next/font/google";
import Link from "next/link";

// If loading a variable font, you don't need to specify the font weight
const headingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Page(props: { user: User }) {
  return (
    <>
      <nav
        className={cn(
          "z-10",
          "px-4 md:px-8 py-4",
          "flex items-center justify-between",
          "border-b border-gray-200",
          "transition duration-200",
          "transform"
        )}
      >
        <Link href="/" className={cn(headingFont.className, "font-bold")}>
          {config.appName}
        </Link>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <Avatar className="border border-neutral-300">
                <AvatarFallback>{props.user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="py-2" align="end">
              <DropdownMenuItem className="font-bold">
                {props.user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout" className="cursor-pointer">
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <div className="flex flex-col justify-center items-center gap-4 text-center pt-12">
        <h1 className="text-3xl font-bold">Thanks for joining!</h1>
        <div className="flex flex-col justify-center items-center">
          <p className="text-neutral-500">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            You've been added to the waiting list.
            <br />
            We will notify you when your account is ready.
          </p>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const user = await getPageServerUser(ctx);

  if (!user) return returnRedirectToLogin;

  const subscriptions = await getPageServerSubscriptions(ctx);

  if (subscriptions && subscriptions.length > 0) {
    return returnRedirectToApp;
  }

  return {
    props: {
      user,
    },
  };
}
