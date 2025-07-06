import React from "react";
import { View, FlatList, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useSearch } from "../hooks/search/useSearch";
import { SearchHeader } from "../components/search/SearchHeader";
import { BubbleGraphics } from "../components/search/BubbleGraphics";
import { SearchItem } from "../components/search/SearchItem";
import { SuggestionItem } from "../components/search/SuggestionItem";

export default function SearchScreen() {
  const {
    search,
    setSearch,
    suggestions,
    filteredItems,
    showMainList,
    loading,
    hasMore,
    searchInputRef,
    handleTextChange,
    handleItemPress,
    loadItems,
    type,
    filters,
    router,
  } = useSearch();

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1 bg-gray-100 p-4">
        <SearchHeader
          search={search}
          setSearch={setSearch}
          type={type}
          filters={filters}
          router={router}
          searchInputRef={searchInputRef}
          handleTextChange={handleTextChange}
        />
        <BubbleGraphics />
        {suggestions.length > 0 && !showMainList && (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.id}${item.type}${index}`}
            renderItem={({ item }) => <SuggestionItem item={item} onPress={handleItemPress} />}
            className="bg-white mt-2 rounded-lg shadow-sm max-h-40"
            keyboardShouldPersistTaps="handled"
          />
        )}
        {showMainList && (
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.id}${item.type}${index}`}
            renderItem={({ item }) => <SearchItem item={item} onPress={handleItemPress} />}
            onEndReached={loadItems}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            className="mt-4"
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}