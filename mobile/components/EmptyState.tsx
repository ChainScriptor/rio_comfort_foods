import { View, Text } from "react-native";
import { Icon, type IconName } from "@/components/Icon";

interface EmptyStateProps {
  icon?: IconName;
  iconSize?: number;
  title: string;
  description?: string;
  header?: string;
}

export function EmptyState({
  icon = "folder-open-outline",
  iconSize = 80,
  title,
  description,
  header,
}: EmptyStateProps) {
  return (
    <View className="flex-1 bg-background">
      {header && (
        <View className="px-6 pt-16 pb-5">
          <Text className="text-text-primary text-3xl font-bold tracking-tight">{header}</Text>
        </View>
      )}
      <View className="flex-1 items-center justify-center px-6">
        <Icon name={icon} size={iconSize} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">{title}</Text>
        {description && <Text className="text-text-secondary text-center mt-2">{description}</Text>}
      </View>
    </View>
  );
}
