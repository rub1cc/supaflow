import { Container } from "@/components/container";
import { Editable } from "@/components/editable";
import { Meta } from "@/components/meta";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Image } from "@/components/ui/image";
import { getPageServerUser } from "@/utils/account";
import { cn } from "@/utils/cn";
import config from "@/utils/config";
import { createOGImage } from "@/utils/create-og-image";
import { Database } from "@/utils/database.types";
import { Step, Workflow } from "@/utils/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  ChevronLeftIcon,
  CopyIcon,
  DotsHorizontalIcon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { User, createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Compressor from "compressorjs";
import { format } from "date-fns";
import { GetServerSidePropsContext } from "next";
import { Libre_Baskerville } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { toast } from "sonner";

const MAX_FILE_SIZE = 1024 * 1024 * 2; // 2MB

// If loading a variable font, you don't need to specify the font weight
const headingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

type PageProps = {
  user: User | null;
  workflow: Workflow;
};

export default function Page({ workflow: defaultWorkflow, user }: PageProps) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [refAnimationWorkflowList] = useAutoAnimate();
  const [editing, setEditing] = useState(false);
  const [workflow, setWorkflow] = useState(defaultWorkflow);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const isAuthenticated = user?.id;

  const eligibleToEdit = isAuthenticated && workflow.user_id === user?.id;

  const updateItemProperty = (index: number, property: string, value: any) => {
    if (!editing) return;
    const newItems = [...(workflow.items as Step[])];
    newItems[index] = {
      ...newItems[index],
      [property]: value,
    };

    setWorkflow({
      ...workflow,
      items: newItems,
    });
  };

  const addItem = (targetIndex: number) => {
    if (!editing) return;
    const newItems = [...(workflow.items as Step[])];
    newItems.splice(targetIndex, 0, {
      id: "step-" + new Date().getTime(),
      type: "STEP",
      title: "",
    });

    setWorkflow({
      ...workflow,
      items: newItems,
    });
  };

  const removeItem = (targetIndex: number) => {
    if (!editing) return;
    const newItems = [...(workflow.items as Step[])];
    newItems.splice(targetIndex, 1);

    setWorkflow({
      ...workflow,
      items: newItems,
    });
  };

  const duplicateItem = (targetIndex: number) => {
    if (!editing) return;
    const newItems = [...(workflow.items as Step[])];
    newItems.splice(targetIndex + 1, 0, {
      ...newItems[targetIndex],
      id: "step-" + new Date().getTime(),
    });

    setWorkflow({
      ...workflow,
      items: newItems,
    });
  };

  const save = async () => {
    const id = workflow.id;
    let slug = defaultWorkflow.slug;

    if (defaultWorkflow.title !== workflow.title) {
      slug = workflow.title?.replace(/[^a-zA-Z0-9]/g, "-") as string;
    }

    // check if title is less than 3 characters
    if (workflow.title && workflow.title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("workflows")
      .update({
        title: workflow.title,
        description: workflow.description,
        slug,
        items: workflow.items,
        updated_at: new Date(),
        meta: {
          title: workflow.title,
          description: workflow.description,
          image: createOGImage({
            title: workflow.title as string,
            updatedAt: format(
              new Date(workflow.updated_at as string),
              "dd MMMM yyyy"
            ),
            steps: String(workflow.items?.length),
            authorName: user?.user_metadata?.full_name,
            authorAvatar: user?.user_metadata?.avatar_url,
          }),
        },
      })
      .eq("id", id)
      .select("*");

    await new Promise((resolve) => setTimeout(resolve, 750));

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data) {
      toast.error("Ups, something went wrong");
      return;
    }

    toast.success("Workflow saved!");

    router.replace("/app/workflow/" + slug + "-" + defaultWorkflow.uid, undefined, { shallow: false });

    setEditing(false);
  };

  const handleClickUpload = async (file: File, index: number) => {
    const isSizeValid = file.size <= MAX_FILE_SIZE;

    if (!isSizeValid) {
      toast.error("File size must be less than 2MB");
      return;
    }

    new Compressor(file, {
      quality: 0.8,
      mimeType: "image/jpeg",
      success: (res) => uploadFile(res, index),
    });
  };

  const uploadFile = async (file: File | Blob, index: number) => {
    const fileName = `${user?.id}/img-${new Date().getTime()}.${
      file.type.split("/")[1]
    }`;
    setUploading(index);
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, {
        upsert: true,
      });
    setUploading(null);

    if (error || !data.path) {
      toast.error("Oops, something went wrong when uploading the image");
      return;
    }

    updateItemProperty(index, "screenshot", {
      url:
        process.env.NEXT_PUBLIC_SUPABASE_URL +
        `/storage/v1/object/public/uploads/${data.path}`,
    });
  };

  return (
    <>
      <Meta
        title={workflow.title as string}
        description={workflow.description as string}
        url={`${process.env.NEXT_PUBLIC_BASE_URL}/app/workflow/${workflow.slug}-${workflow.uid}`}
        image={workflow.meta?.image}
      />
      <div className="bg-neutral-50 py-24 md:py-32 text-neutral-900 min-h-screen page">
        {/* navbar default */}
        <nav
          className={cn(
            "z-10",
            "px-2 md:px-8 py-4",
            "fixed w-full top-0 bg-white",
            "flex items-center justify-between",
            "border-b border-gray-200",
            "transition duration-200",
            "transform",
            editing && "-translate-y-[100px]"
          )}
        >
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.push("/app")}
              >
                <ChevronLeftIcon />
              </Button>
            )}
            <Link href="/" className={cn(headingFont.className, "font-bold")}>
              {config.appName}
            </Link>
          </div>

          <div
            className={cn(
              "flex items-center",
              "space-x-2",
              "transition duration-200",
              "transform",
              editing && "-translate-y-[100px]"
            )}
          >
            {/* <Button size="icon" onClick={() => setEditing(true)} variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
          </Button> */}
            {eligibleToEdit && (
              <Button onClick={() => setEditing(true)} variant="outline">
                Edit
              </Button>
            )}
            <Button
              onClick={() => {
                // copy link to clipboard
                navigator.clipboard.writeText(window.location.href);

                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1000);
              }}
            >
              {copied ? "Link copied!" : "Share"}
            </Button>
          </div>
        </nav>

        {/* navbar editing */}
        <nav
          className={cn(
            "z-10",
            "px-8 py-4",
            "fixed w-full top-0",
            "flex items-center justify-end",
            "transition duration-200",
            "transform",
            !editing && "-translate-y-[100px]"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              "space-x-2",
              "transition duration-200"
            )}
          >
            <Button onClick={() => save()} disabled={loading}>
              {loading ? "Saving..." : "Save workflow"}
            </Button>
          </div>
        </nav>

        {/* content */}
        <Container>
          {/* workflow detail */}
          <div className="px-8">
            <Editable
              newLine={false}
              placeholder="What is the title of this workflow?"
              disabled={!editing}
              className={cn(
                "text-2xl md:text-4xl md:leading-normal",
                headingFont.className
              )}
              value={workflow.title as string}
              onChange={(value) => setWorkflow({ ...workflow, title: value })}
              textOnly
            />
            {((workflow.description && workflow.description?.length > 3) ||
              eligibleToEdit) && (
              <Editable
                placeholder="Give a short description of this workflow."
                disabled={!editing}
                multiline
                className={cn("text-lg mt-4")}
                value={workflow.description ?? ""}
                onChange={(value) =>
                  setWorkflow({ ...workflow, description: value })
                }
                textOnly
              />
            )}
          </div>

          {/* workflow items */}
          <div
            className="mt-8 md:mt-12 space-y-2 md:space-y-6"
            ref={refAnimationWorkflowList}
          >
            {!(workflow.items as Step[]).length && (
              <div className="overflow-hidden flex flex-col justify-center items-center bg-white rounded-lg h-[200px] shadow">
                <p
                  className={cn(
                    "transition duration-300",
                    !editing && "translate-y-[25px]"
                  )}
                >
                  <span className="font-bold">No step</span> in this workflow.
                </p>
                <Button
                  className={cn(
                    "transition duration-400 mt-4 opacity-0 translate-y-[10px]",
                    editing
                      ? "opacity-100 translate-y-0"
                      : "pointer-evetns-none cursor-default"
                  )}
                  onClick={() => addItem(0)}
                >
                  <PlusIcon />
                  Add step
                </Button>
              </div>
            )}
            {(workflow.items as Step[])?.map((item, index) => {
              // step
              return (
                <div key={item.id}>
                  <div
                    className={cn(
                      "relative group",
                      "bg-white shadow",
                      "p-2 md:p-6 border border-neutral-100 md:rounded-2xl"
                    )}
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex w-full space-x-4">
                        {/* step number */}
                        <span className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-neutral-100">
                          {index + 1}
                        </span>

                        {/* step title */}
                        <Editable
                          placeholder="Untitled step"
                          disabled={!editing}
                          multiline
                          className={cn("w-full mt-2 max-w-[85%]")}
                          value={item.title}
                          onChange={(value) =>
                            updateItemProperty(index, "title", value)
                          }
                        />
                      </div>

                      {item.screenshot?.url && (
                        <TransformWrapper
                          key={item.screenshot.url}
                          initialScale={1}
                          pinch={{
                            disabled: true,
                          }}
                          wheel={{
                            disabled: true,
                          }}
                        >
                          {({ zoomIn, zoomOut }) => {
                            return (
                              <div className="relative border border-neutral-100 rounded-xl overflow-hidden">
                                <TransformComponent
                                  wrapperStyle={{
                                    width: "100%",
                                  }}
                                  contentStyle={{
                                    width: "100%",
                                  }}
                                >
                                  {/* step image */}
                                  <Image
                                    id={"image-" + item.id}
                                    src={item.screenshot!.url}
                                    alt={`image step ` + (index + 1)}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    style={{ width: "100%", height: "auto" }}
                                  />
                                </TransformComponent>

                                {/* step image control */}
                                {editing && (
                                  <div className="absolute bottom-4 left-4 rounded-xl bg-neutral-800 text-white">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="hover:bg-transparent hover:text-white"
                                      onClick={() => {
                                        updateItemProperty(
                                          index,
                                          "screenshot",
                                          null
                                        );
                                      }}
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </div>
                                )}
                                <div className="absolute bottom-4 right-4 rounded-xl bg-neutral-800 text-white">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-transparent hover:text-white"
                                    onClick={() => zoomOut()}
                                  >
                                    <MinusIcon />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-transparent hover:text-white"
                                    onClick={() => zoomIn()}
                                  >
                                    <PlusIcon />
                                  </Button>
                                </div>
                              </div>
                            );
                          }}
                        </TransformWrapper>
                      )}
                    </div>

                    {/* step context menu */}
                    {editing && (
                      <div className="absolute right-1 top-1 transition duration-200">
                        {!item.screenshot?.url && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full text-sm"
                              disabled={uploading === index}
                              asChild
                            >
                              {uploading == index ? (
                                <div>
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      stroke-width="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                </div>
                              ) : (
                                <label htmlFor={`image-upload-${index}`}>
                                  <ImageIcon />
                                </label>
                              )}
                            </Button>
                            <input
                              id={`image-upload-${index}`}
                              type="file"
                              accept="image/png, image/jpeg"
                              className="hidden"
                              onChange={(e) => {
                                e.target.files?.[0] &&
                                  handleClickUpload(e.target.files[0], index);
                              }}
                            />
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full"
                            >
                              <DotsHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl bg-neutral-900 border-none">
                            <DropdownMenuItem
                              className="rounded-lg text-white hover:bg-neutral-700/70 focus:bg-neutral-700/70 hover:text-white focus:text-white"
                              onClick={() => duplicateItem(index)}
                            >
                              <CopyIcon className="mr-2" />
                              Duplicate step
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg text-red-500 hover:bg-neutral-700/70 focus:bg-neutral-700/70 hover:text-red-500 focus:text-red-500"
                              onClick={() => removeItem(index)}
                            >
                              <TrashIcon className="mr-2" />
                              Delete step
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    {/* step control */}
                    {editing && (
                      <>
                        <div className="absolute flex justify-center -top-3 w-full opacity-0 group-hover:opacity-100 transition duration-300">
                          <Button
                            size="icon"
                            className="rounded-full w-6 h-6"
                            onClick={() => {
                              addItem(index);
                            }}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute flex justify-center -bottom-3 w-full opacity-0 group-hover:opacity-100 transition duration-300">
                          <Button
                            size="icon"
                            className="rounded-full w-6 h-6"
                            onClick={() => {
                              addItem(index + 1);
                            }}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createPagesServerClient<Database>(ctx);
  const user = await getPageServerUser(ctx);
  const slug = ctx.query.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  const uid = slug?.split("-").pop() as string;

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error || !data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      user,
      workflow: data,
    },
  };
}
