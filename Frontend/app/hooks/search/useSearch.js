import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useFilters } from "../../context/FilterContext";
import { fetchItemsFromApi, areFiltersApplied } from "./searchUtils";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export const useSearch = () => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [showMainList, setShowMainList] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { filters, setFilters } = useFilters();
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const limit = 10;

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle app background/foreground state
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Clean up when app goes to background
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback(async () => {
    if (filters.resetSearch) {
      resetSearchState();
      setFilters(prev => ({ ...prev, resetSearch: false }));
      return;
    }

    if (search.length < 2 && !areFiltersApplied(filters)) {
      resetSearchState();
      return;
    }

    try {
      setLoading(true);
      const itemType = type || "event";
      const results = await fetchItemsFromApi(itemType, search, 1, limit, filters, abortControllerRef);
      
      setSuggestions(results.items);
      setFilteredItems(results.items);
      setShowMainList(true);
      setPage(2);
      setHasMore(results.hasMore);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error searching items:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [search, type, filters]);

  const resetSearchState = () => {
    setSuggestions([]);
    setShowMainList(false);
    setFilteredItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Handle text change with debouncing
  const handleTextChange = (text) => {
    setSearch(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (text.length >= 2 || areFiltersApplied(filters)) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 300);
    } else {
      resetSearchState();
    }
  };

  // Load more items for infinite scroll
  const loadItems = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const itemType = type || "event";
      const response = await fetchItemsFromApi(itemType, search, page, limit, filters, abortControllerRef);
      
      setFilteredItems((prev) => {
        const newItems = [...prev, ...response.items];
        const uniqueItems = Array.from(
          new Map(newItems.map((item) => [`${item.id}${item.type}`, item])).values()
        );
        return uniqueItems;
      });
      setPage(page + 1);
      setHasMore(response.hasMore);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching more items:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, type, filters, search]);

  // Fetch on filter apply or screen focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchOnFocus = async () => {
        if (!isActive) return;
        
        if (filters.resetSearch) {
          resetSearchState();
          setFilters(prev => ({ ...prev, resetSearch: false }));
          return;
        }

        if (search.length < 2 && !areFiltersApplied(filters)) {
          resetSearchState();
          return;
        }

        try {
          setLoading(true);
          const itemType = type || "event";
          const results = await fetchItemsFromApi(itemType, search, 1, limit, filters, abortControllerRef);
          
          if (isActive) {
            setFilteredItems(results.items);
            setShowMainList(true);
            setPage(2);
            setHasMore(results.hasMore);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching items on screen focus:", error);
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchOnFocus();

      return () => {
        isActive = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [search, filters, type])
  );

  // Handle item press
  const handleItemPress = (item) => {
    router.push({
      pathname: item.type === "event" ? "/screens/EventDetails" : "/screens/GroupDetails",
      params: item.type === "event" ? { eventId: item.id } : { groupId: item.id },
    });
  };

  return {
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
  };
};