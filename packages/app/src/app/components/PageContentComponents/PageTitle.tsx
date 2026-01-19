import { Title, Text } from '@mantine/core';

type PageTitleProps = {
  title: string;
  description?: string; // <--- Made Optional
};

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <>
      <Title order={2}>{title}</Title>
      {description && (
        <Text size="md" c="dimmed">
          {description}
        </Text>
      )}
    </>
  );
}