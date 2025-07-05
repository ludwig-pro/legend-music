import { Text, View, ScrollView, Linking } from "react-native";
import { Button } from "@/components/Button";

interface Library {
    name: string;
    description: string;
    url: string;
}

const libraries: Library[] = [
    {
        name: "React Native macOS",
        description: "Native macOS app development framework",
        url: "https://github.com/microsoft/react-native-macos"
    },
    {
        name: "Legend State",
        description: "Fast and powerful state management",
        url: "https://github.com/LegendApp/legend-state"
    },
    {
        name: "Legend List",
        description: "High-performance virtualized list component",
        url: "https://github.com/LegendApp/legend-list"
    },
    {
        name: "Expo",
        description: "Platform for universal React applications",
        url: "https://github.com/expo/expo"
    },
    {
        name: "NativeWind",
        description: "Tailwind CSS for React Native",
        url: "https://github.com/nativewind/nativewind"
    },
    {
        name: "Tailwind CSS",
        description: "Utility-first CSS framework",
        url: "https://github.com/tailwindlabs/tailwindcss"
    },
    {
        name: "id3js",
        description: "JavaScript library for reading ID3 tags",
        url: "https://github.com/43081j/id3"
    },
    {
        name: "Gorhom Portal",
        description: "React Native portal implementation",
        url: "https://github.com/gorhom/react-native-portal"
    },
    {
        name: "Biome",
        description: "Fast formatter and linter for web projects",
        url: "https://github.com/biomejs/biome"
    }
];

export function OpenSourceSettings() {
    const handleOpenLink = (url: string) => {
        Linking.openURL(url);
    };

    const handleOpenLegendMusicSource = () => {
        // TODO: Add actual repository URL when available
        console.log("Open Legend Music repository");
    };

    return (
        <ScrollView className="flex-1 p-6">
            <View className="max-w-4xl">
                <Text className="text-2xl font-bold text-white mb-6">
                    Open Source
                </Text>
                
                <View className="mb-8">
                    <Text className="text-lg font-semibold text-white mb-4">
                        Legend Music is Open Source
                    </Text>
                    <Text className="text-white/80 text-base leading-relaxed mb-4">
                        Legend Music is completely free and open source. You can view the source code, 
                        contribute to its development, and even create your own version. We believe in 
                        transparency and community-driven development.
                    </Text>
                    <Button 
                        onPress={handleOpenLegendMusicSource}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg self-start"
                    >
                        <Text className="text-white font-medium">
                            View Source Code
                        </Text>
                    </Button>
                </View>

                <View className="mb-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                    <Text className="text-xl font-semibold text-white mb-3">
                        🚀 Legend Kit
                    </Text>
                    <Text className="text-white/90 text-base leading-relaxed mb-4">
                        Legend Kit is a comprehensive suite of tools built on top of Legend State, Legend List, 
                        and Legend Motion. It includes premium versions of Legend Music and other Legend apps, 
                        along with advanced development tools and components.
                    </Text>
                    <Text className="text-white/80 text-sm mb-4">
                        Legend Kit includes:
                    </Text>
                    <View className="ml-4 mb-4">
                        <Text className="text-white/80 text-sm">• Premium Legend Music with advanced features</Text>
                        <Text className="text-white/80 text-sm">• Additional Legend apps and tools</Text>
                        <Text className="text-white/80 text-sm">• Advanced UI components and utilities</Text>
                        <Text className="text-white/80 text-sm">• Priority support and updates</Text>
                        <Text className="text-white/80 text-sm">• Access to exclusive development resources</Text>
                    </View>
                    <Button 
                        onPress={() => handleOpenLink("https://legendapp.com/kit")}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg self-start"
                    >
                        <Text className="text-white font-medium">
                            Learn More About Legend Kit
                        </Text>
                    </Button>
                </View>

                <View>
                    <Text className="text-lg font-semibold text-white mb-4">
                        Built With Amazing Open Source Libraries
                    </Text>
                    <Text className="text-white/80 text-base leading-relaxed mb-6">
                        Legend Music is built on top of these fantastic open source projects:
                    </Text>
                    
                    <View className="space-y-4">
                        {libraries.map((library, index) => (
                            <View key={index} className="flex-row items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                <View className="flex-1 mr-4">
                                    <Text className="text-white font-medium text-base mb-1">
                                        {library.name}
                                    </Text>
                                    <Text className="text-white/70 text-sm">
                                        {library.description}
                                    </Text>
                                </View>
                                <Button 
                                    onPress={() => handleOpenLink(library.url)}
                                    className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded border border-white/20"
                                >
                                    <Text className="text-white/90 text-sm">
                                        GitHub
                                    </Text>
                                </Button>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
                    <Text className="text-white/80 text-sm leading-relaxed">
                        We're grateful to all the maintainers and contributors of these projects. 
                        Open source software makes amazing applications like Legend Music possible.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}