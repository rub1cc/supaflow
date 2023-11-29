import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";

export default function Page() {
  return <p>Please wait...</p>;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabaseClient = createPagesServerClient(ctx);

  await supabaseClient.auth.signOut();

  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
}
