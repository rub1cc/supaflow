import { Container } from "@/components/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getPageServerSubscriptions,
  getPageServerUser,
  returnRedirectToLogin,
  returnRedirectToWaitingAccess,
} from "@/utils/account";
import { cn } from "@/utils/cn";
import config from "@/utils/config";
import { createOGImage } from "@/utils/create-og-image";
import { generateRandomId } from "@/utils/generate-random-key";
import { Step, Workflow } from "@/utils/types";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import {
  DotsVerticalIcon,
  Pencil1Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { GetServerSidePropsContext } from "next";
import { Libre_Baskerville } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";

// If loading a variable font, you don't need to specify the font weight
const headingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function Page(props: {
  user: User;
  subscriptions: {
    id: string;
  };
  workflows: Workflow[];
}) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [creating, setCreating] = useState(false);

  const createNewWorkflow = async () => {
    const title = "Untitled workflow";
    const slug = title.replace(/[^a-zA-Z0-9]/g, "-");
    const uid = generateRandomId();

    setCreating(true);

    const { data, error } = await supabase
      .from("workflows")
      .insert([
        {
          uid,
          title,
          slug,
          items: [],
          meta: {
            title,
            description: "",
            image: createOGImage({
              title,
              updatedAt: format(new Date(), "dd MMM yyyy"),
              steps: "0",
              authorName: props.user?.user_metadata?.full_name,
              authorAvatar: props.user?.user_metadata?.avatar_url,
            }),
          },
        },
      ])
      .select("slug");

    await new Promise((resolve) => setTimeout(resolve, 750));

    setCreating(false);

    if (error) {
      toast.error("Failed to create new workflow. Please try again later.");
      return;
    }

    if (!data?.[0]) {
      toast.error("Failed to create new workflow. Please try again later.");
      return;
    }

    router.push(`/app/workflow/${data[0].slug}-${uid}`);
  };

  const deleteWorkflow = async (id: string) => {
    const { data, error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .select("id");

    if (error || !data) {
      toast.error("Failed to delete workflow. Please try again later.");
      return;
    }

    router.reload();
  };

  return (
    <div className="page">
      {/* navbar default */}
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
        <p className={cn(headingFont.className, "font-bold")}>
          {config.appName}
        </p>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Button
              className="flex gap-2 items-center"
              onClick={createNewWorkflow}
              disabled={creating}
            >
              {creating ? (
                "Creating..."
              ) : (
                <>
                  <PlusIcon />
                  New workflow
                </>
              )}
            </Button>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2">
              <Avatar className="border border-neutral-300">
                <AvatarFallback>{props.user.email?.charAt(0)}</AvatarFallback>
                <AvatarImage src={props.user.user_metadata.avatar_url} />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="py-2" align="end">
              <DropdownMenuItem className="flex-col items-start">
                <span className="font-bold">
                  {props.user.user_metadata.full_name}
                </span>
                <span>{props.user.email}</span>
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

      <Container className="py-8 px-4 md:px-0">
        <p className="text-xl font-semibold">Workflows</p>

        <div className="mt-4 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.workflows.map((item) => {
            return (
              <Link
                key={item.title}
                href={`/app/workflow/${item.slug}-${item.uid}`}
                className="relative p-4 bg-neutral-50 border border-neutral-200 rounded-lg flex flex-col justify-between gap-4"
              >
                <div className="flex gap-2 justify-between">
                  <p className="text-lg font-semibold">{item.title}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <DotsVerticalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl border-none">
                      <DropdownMenuItem className="rounded-lg" asChild>
                        <Link href={`/app/workflow/${item.slug}-${item.uid}`}>
                          <Pencil1Icon className="mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg"
                        onClick={() => deleteWorkflow(item.id)}
                      >
                        <TrashIcon className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {(item.items as Step[])?.length} steps
                  </p>
                  <span>·</span>
                  <p className="text-sm text-gray-500">
                    Edited{" "}
                    {format(new Date(item.updated_at as string), "dd MMM yyyy")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        {!(props.workflows.length > 0) && (
          <div className="bg-neutral-100 border border-100 rounded-lg w-full flex flex-col justify-center items-center gap-4 min-h-[200px]">
            <p className="text-gray-500 text-center">
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              You don't have any workflows yet.
            </p>
            <Button
              variant="outline"
              className="bg-white"
              onClick={createNewWorkflow}
              disabled={creating}
            >
              {creating ? (
                "Creating..."
              ) : (
                <>
                  Create your first workflow <PlusIcon className="ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createPagesServerClient(ctx);
  const user = await getPageServerUser(ctx);

  if (!user) return returnRedirectToLogin;

  const subscriptions = await getPageServerSubscriptions(ctx);

  if (subscriptions && !(subscriptions.length > 0)) {
    return returnRedirectToWaitingAccess;
  }

  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      props: {
        workflows: [],
        user,
      },
    };
  }

  return {
    props: {
      workflows,
      user,
      subscriptions,
    },
  };
}
