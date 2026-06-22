"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  updateLesson,
  updateModule,
  type LessonUpsert,
} from "@/actions/course.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CourseModule, CourseWithModules, Lesson } from "@/lib/supabase/queries/courses";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Lesson Form — inline expand/collapse per lesson
// ---------------------------------------------------------------------------

function LessonForm({
  lesson,
  productId,
  onDelete,
}: {
  lesson: Lesson;
  productId: string;
  onDelete: (lessonId: string) => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(lesson.title);
  const [slug, setSlug] = useState(lesson.slug);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? "");
  const [content, setContent] = useState(lesson.content ?? "");
  const [isPreview, setIsPreview] = useState(lesson.is_preview);

  function handleSave() {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên bài học.");
      return;
    }
    const finalSlug = slug.trim() || slugify(title);

    startTransition(async () => {
      const fields: Partial<LessonUpsert> = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
        content: content.trim() || null,
        is_preview: isPreview,
      };

      const result = await updateLesson(lesson.id, productId, fields);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã lưu bài học.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Xóa bài học "${lesson.title}"? Không thể hoàn tác.`)) return;

    startTransition(async () => {
      const result = await deleteLesson(lesson.id, productId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã xóa bài học.");
      onDelete(lesson.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border bg-background">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
      >
        {isOpen ? (
          <ChevronUpIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-medium">{title || "Bài học chưa có tên"}</span>
        {isPreview && (
          <Badge variant="outline" className="shrink-0 text-xs">
            <EyeIcon aria-hidden="true" data-icon="inline-start" />
            Xem trước
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="border-t px-3 pb-3 pt-3">
          <FieldGroup>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Tiêu đề</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug || slug === slugify(lesson.title)) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="Tên bài học"
                />
              </Field>
              <Field>
                <FieldLabel>Slug</FieldLabel>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="lesson-slug"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Mô tả</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn (tùy chọn)"
              />
            </Field>

            <Field>
              <FieldLabel>URL video</FieldLabel>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="URL YouTube hoặc video trực tiếp"
              />
            </Field>

            <Field>
              <FieldLabel>Nội dung (Markdown)</FieldLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung bài học bằng Markdown"
                rows={6}
              />
            </Field>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  id={`preview-${lesson.id}`}
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="size-4 cursor-pointer rounded border-input accent-primary"
                />
                <label htmlFor={`preview-${lesson.id}`} className="cursor-pointer select-none">
                  Cho xem trước miễn phí
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? (
                    <Loader2Icon aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                  )}
                  Xóa
                </Button>
                <Button size="sm" disabled={isPending} onClick={handleSave}>
                  {isPending && (
                    <Loader2Icon aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          </FieldGroup>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Lesson Form
// ---------------------------------------------------------------------------

function AddLessonForm({
  moduleId,
  productId,
  nextPosition,
  onAdded,
}: {
  moduleId: string;
  productId: string;
  nextPosition: number;
  onAdded: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên bài học.");
      return;
    }

    startTransition(async () => {
      const result = await createLesson(moduleId, productId, {
        title: title.trim(),
        slug: slugify(title.trim()),
        position: nextPosition,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã thêm bài học.");
      setTitle("");
      onAdded();
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tên bài học mới"
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <Button size="sm" disabled={isPending || !title.trim()} onClick={handleAdd}>
        {isPending ? (
          <Loader2Icon aria-hidden="true" className="animate-spin" />
        ) : (
          <PlusIcon aria-hidden="true" />
        )}
        Thêm
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Module Card
// ---------------------------------------------------------------------------

function ModuleCard({
  mod,
  productId,
  totalModules,
  onDelete,
  onMove,
}: {
  mod: CourseModule;
  productId: string;
  totalModules: number;
  onDelete: (moduleId: string) => void;
  onMove: (moduleId: string, direction: "up" | "down") => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(mod.title);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>(mod.lessons);

  function handleTitleBlur() {
    if (!title.trim() || title.trim() === mod.title) return;

    startTransition(async () => {
      const result = await updateModule(mod.id, productId, { title: title.trim() });
      if (!result.ok) {
        toast.error(result.error);
        setTitle(mod.title);
      }
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Xóa chương "${mod.title}" và toàn bộ bài học? Không thể hoàn tác.`
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteModule(mod.id, productId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã xóa chương.");
      onDelete(mod.id);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Module header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Di chuyển lên"
              disabled={mod.position <= 1 || isPending}
              onClick={() => onMove(mod.id, "up")}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronUpIcon aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              title="Di chuyển xuống"
              disabled={mod.position >= totalModules || isPending}
              onClick={() => onMove(mod.id, "down")}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronDownIcon aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Tên chương"
        />

        <span className="text-xs text-muted-foreground">{lessons.length} bài học</span>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          title={isExpanded ? "Thu gọn" : "Mở rộng"}
        >
          {isExpanded ? (
            <ChevronUpIcon aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          )}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          title="Xóa chương"
        >
          {isPending ? (
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2Icon aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-2 p-3">
          {lessons.map((lesson) => (
            <LessonForm
              key={lesson.id}
              lesson={lesson}
              productId={productId}
              onDelete={(lessonId) =>
                setLessons((prev) => prev.filter((l) => l.id !== lessonId))
              }
            />
          ))}

          {lessons.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">
              Chưa có bài học. Thêm một bài bên dưới.
            </p>
          )}

          <AddLessonForm
            moduleId={mod.id}
            productId={productId}
            nextPosition={lessons.length + 1}
            onAdded={() => {
              // router.refresh() inside AddLessonForm handles re-fetch
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CourseEditor — top-level client component
// ---------------------------------------------------------------------------

export function CourseEditor({
  course,
  productId,
}: {
  course: CourseWithModules;
  productId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modules, setModules] = useState<CourseModule[]>(course.modules);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  function handleAddModule() {
    if (!newModuleTitle.trim()) {
      toast.error("Vui lòng nhập tên chương.");
      return;
    }

    startTransition(async () => {
      const result = await createModule(
        course.id,
        productId,
        newModuleTitle.trim(),
        modules.length + 1
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Đã thêm chương.");
      setNewModuleTitle("");
      router.refresh();
    });
  }

  function handleMoveModule(moduleId: string, direction: "up" | "down") {
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx < 0) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const reordered = [...modules];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

    const updated = reordered.map((m, i) => ({ ...m, position: i + 1 }));
    setModules(updated);

    startTransition(async () => {
      await Promise.all([
        updateModule(updated[idx].id, productId, { position: updated[idx].position }),
        updateModule(updated[targetIdx].id, productId, { position: updated[targetIdx].position }),
      ]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {modules.map((mod) => (
        <ModuleCard
          key={mod.id}
          mod={mod}
          productId={productId}
          totalModules={modules.length}
          onDelete={(moduleId) =>
            setModules((prev) => prev.filter((m) => m.id !== moduleId))
          }
          onMove={handleMoveModule}
        />
      ))}

      {modules.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có chương nào. Thêm chương đầu tiên bên dưới.
        </div>
      )}

      {/* Add module */}
      <div className="flex gap-2">
        <Input
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="Tên chương mới"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddModule();
          }}
        />
        <Button disabled={isPending || !newModuleTitle.trim()} onClick={handleAddModule}>
          {isPending ? (
            <Loader2Icon aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : (
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
          )}
          Thêm chương
        </Button>
      </div>
    </div>
  );
}
