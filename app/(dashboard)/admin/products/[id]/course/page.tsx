import { notFound, redirect } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { createCourse } from "@/actions/course.actions";
import { CourseEditor } from "@/components/admin/course-editor";
import { Button } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/auth/roles";
import { getAdminCourseByProductId } from "@/lib/supabase/queries/courses";
import { getAdminProductById } from "@/lib/supabase/queries/products";

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold tracking-normal">
          Nội dung khóa học
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Quản lý chương và bài học cho khóa học này. Thay đổi được lưu ngay.
        </p>
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
          Chưa có nội dung khóa học
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Khởi tạo sản phẩm này thành khóa học để bắt đầu thêm chương và bài học.
        </p>
      </div>
      <form action={handleInit}>
        <Button type="submit">
          <BookOpenIcon aria-hidden="true" data-icon="inline-start" />
          Khởi tạo khóa học
        </Button>
      </form>
    </div>
  );
}
