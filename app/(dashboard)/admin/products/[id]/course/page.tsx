import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";

import { createCourse } from "@/actions/course.actions";
import { CourseEditor } from "@/components/admin/course-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getAdminCourseByProductId } from "@/lib/supabase/queries/courses";
import { getAdminProductById } from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [product, course] = await Promise.all([
    getAdminProductById(id),
    getAdminCourseByProductId(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}
        >
          <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
          Back to Product Edit
        </Link>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Course content editor</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {product.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage modules and lessons for this course. Changes are saved immediately.
          </p>
        </div>
      </div>

      {course ? (
        <CourseEditor course={course} productId={id} />
      ) : (
        <InitializeCourseSection productId={id} productTitle={product.title} />
      )}
    </div>
  );
}

function InitializeCourseSection({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  async function handleInit() {
    "use server";
    await createCourse(productId, productTitle);
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-lg border border-dashed bg-card p-8 text-center text-card-foreground">
      <div className="flex size-12 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        <BookOpenIcon aria-hidden="true" />
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-normal">
          No course content yet
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Initialize this product as a course to start adding modules and lessons.
        </p>
      </div>
      <form action={handleInit}>
        <Button type="submit">
          <BookOpenIcon aria-hidden="true" data-icon="inline-start" />
          Initialize Course
        </Button>
      </form>
    </div>
  );
}
