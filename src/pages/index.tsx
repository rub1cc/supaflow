import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import AppDemo from "../../public/app-demo.png";
import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <Container className="px-4 py-12 flex flex-col justify-center w-screen h-screen">
        <div className="flex flex-col space-y-6 items-center text-center">
          <h1 className="text-3xl md:text-5xl font-bold">
            Document and share <br />{" "}
            <span className="text-blue-500">how-to guides</span> with ease
          </h1>
          <p>
            Create beautiful step-by-step guides with a simple and intuitive
            editor.
          </p>
          <div className="max-w-[400px] w-full flex justify-center">
            <Button asChild>
              <Link href="/app">Get early access</Link>
            </Button>
          </div>
        </div>
        <Image alt="App Demo" src={AppDemo} className="mt-12 rounded-3xl" />
      </Container>
    </div>
  );
}
