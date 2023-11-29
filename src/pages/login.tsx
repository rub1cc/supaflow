import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPageServerUser, returnRedirectToApp } from "@/utils/account";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const [loading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const res = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (res.error) {
      toast.error(
        "We couldn't sign you in. Please check your credentials and try again."
      );
      return;
    }

    router.replace("/app");
  };

  const handleLoginWithGoogle = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error(
        "We couldn't sign you in. Please check your credentials and try again."
      );
      return;
    }

    router.replace("/app");
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen page">
      <div className="max-w-[350px] w-full flex flex-col">
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="text-sm text-gray-500 mb-4">To continue to Supaflow</p>
        <Button
          size="lg"
          variant="outline"
          className="gap-2 justify-between px-4 w-full group"
          onClick={handleLoginWithGoogle}
        >
          <Image alt="App Demo" src="/google.png" width={24} height={24} />
          Sign in with Google
          <ArrowRightIcon className="opacity-0 group-hover:opacity-100 transition duration-200 -translate-x-2 group-hover:translate-x-0" />
        </Button>
      </div>
    </div>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const user = await getPageServerUser(ctx);

  if (user) {
    return returnRedirectToApp;
  }

  return {
    props: {},
  };
}
