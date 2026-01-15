import { cn } from "@/lib/utils";

const variants = {
  card: {
    wrapper: "h-16 w-16 rounded-lg border border-border/60 bg-muted/30 overflow-hidden shrink-0",
    image: "h-full w-full object-cover",
    placeholder: "h-full w-full bg-muted/40",
  },
  hero: {
    wrapper: "w-full h-48 md:h-56 rounded-xl border border-border/60 bg-muted/30 overflow-hidden",
    image: "h-full w-full object-cover",
    placeholder: "h-full w-full bg-muted/40",
  },
} as const;

type RecipeImageProps = {
  imageUrl?: string | null;
  title: string;
  variant?: keyof typeof variants;
  className?: string;
};

export function RecipeImage({
  imageUrl,
  title,
  variant = "card",
  className,
}: RecipeImageProps) {
  const styles = variants[variant];

  return (
    <div className={cn(styles.wrapper, className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`${title} image`} className={styles.image} />
      ) : (
        <div className={styles.placeholder} data-testid="recipe-image-placeholder" />
      )}
    </div>
  );
}
