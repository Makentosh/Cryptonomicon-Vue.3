<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <app-loader :loader="loader" />

    <div class="container">
      <add-ticker
        @add-ticker="add"
        @input-ticker="updateCurrentTicker"
        :error="error"
        :disabled="tooManyTickerAdded"
        :filteredAutocomplete="filteredAutocomplete"
      ></add-ticker>

      <divider-line />

      <button
        v-if="page > 1"
        @click="page = page - 1"
        class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Назад
      </button>
      <span v-if="page > 1">страница: {{ page }}</span>
      <button
        v-if="hasNextPage"
        @click="page = page + 1"
        class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Вперед
      </button>

      <div>Фильтр: <input type="text" v-model="filter" /></div>
      <divider-line />
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div
          v-for="t in paginatedTickers"
          :key="t.name"
          @click="selected(t)"
          :class="{
            'border-4': selectedTicker === t,
            'bg-red-100': t.price === '-'
          }"
          class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
        >
          <div class="px-4 py-5 sm:p-6 text-center">
            <dt class="text-sm font-medium text-gray-500 truncate">
              {{ t.name }} - USD
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {{ formatPrice(t.price) }}
            </dd>
          </div>
          <div class="w-full border-t border-gray-200"></div>
          <button
            @click.stop="handleRemove(t)"
            class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
          >
            <delete-icon />
            Удалить
          </button>
        </div>
      </dl>

      <divider-line />

      <section v-if="selectedTicker" class="relative">
        <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
          {{ selectedTicker.name }}
        </h3>
        <div
          class="flex items-end border-gray-600 border-b border-l h-64"
          ref="graph"
        >
          <div
            class="bg-purple-800 border w-10"
            v-for="(bar, indx) in normalizedGraph"
            :style="{ height: `${bar}%` }"
            :key="indx"
          />
        </div>
        <button
          type="button"
          @click="selectedTicker = null"
          class="absolute top-0 right-0"
        >
          <close-icon />
        </button>
      </section>
    </div>
  </div>
</template>

<script>
// [x] 6. Наличие в состоянии зависимих данних / критичность: 5+
// [x] 4. Запроси напрямую внутри компонента / Критичность 5
// [x] 2. При удалении остаеться подписка на загрузку тикера критичность 5
// [x] 4. обработка ошибок aPI критичность 5
// [x] 3. Количество запросов критичность 4
// [x] 8. При удалении тикера не изменяеться localstorage критичность 4
// [x] 1. Одинаковий код в watch
// [] 9. Localsotrage и анонимние вкладки
// [x] 7. График ужасно виглядит
// [] 10. Магические числа

//
// [х] График сломал если везде одинаковие значения
// [x] При удалении тикера остаеться вибор
import {
  getAutocompleteList,
  subscribeToTicker,
  unsubscribeFromTicker
} from "@/api";
import AddTicker from "@/components/AddTicker";
import DeleteIcon from "@/components/DeleteIcon";
import DividerLine from "@/components/DividerLine";
import AppLoader from "@/components/AppLoader";
import CloseIcon from "@/components/CloseIcon";

export default {
  name: "App",
  components: { CloseIcon, AppLoader, DeleteIcon, AddTicker, DividerLine },
  data() {
    return {
      ticker: "",
      tickers: [],
      selectedTicker: null,
      graph: [],
      loader: false,
      filter: "",
      maxGraphElements: 1,
      page: 1,
      autocomplete: [],
      graphElementWidth: ""
    };
  },
  watch: {
    tickers() {
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },
    selectedTicker() {
      this.graph = [];
      this.$nextTick().then(this.calculateMaxGraphElements);
    },
    filter() {
      this.page = 1;
    },
    pageStateOptions(v) {
      const { pathname } = window.location;
      history.pushState(
        null,
        document.title,
        `${pathname}?filter=${v.filter}&page=${v.page}`
      );
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    }
  },
  computed: {
    tooManyTickerAdded() {
      return this.tickers.length > 1;
    },
    filteredAutocomplete() {
      if (this.ticker.length > 0) {
        return this.autocomplete
          .filter(x => x.includes(this.ticker))
          .slice(0, 4);
      }
      return null;
    },
    error() {
      if (this.paginatedTickers.find(x => x.name === this.ticker)) {
        return true;
      }

      return false;
    },
    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page
      };
    },
    startIndex() {
      return (this.page - 1) * 6;
    },
    endIndex() {
      return this.page * 6;
    },
    filteredTickers() {
      if (this.tickers.length > 0) {
        return this.tickers.filter(ticker =>
          ticker.name.includes(this.filter.toUpperCase())
        );
      }

      return [];
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },
    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },
    normalizedGraph() {
      const maxValue = Math.max(...this.graph);
      const minValue = Math.min(...this.graph);
      if (maxValue === minValue) {
        return this.graph.map(() => 50);
      }
      return this.graph.map(
        price => 5 + ((price - minValue) * 95) / (maxValue - minValue)
      );
    }
  },
  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );
    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = windowData.page;
    }

    this.fetchAutocomplete();
    const tickersData = localStorage.getItem("cryptonomicon-list");

    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach(ticker => {
        subscribeToTicker(ticker.name, (newPrice, type) => {
          this.updateTicker(ticker.name, newPrice, type);
        });
      });
    }
  },
  mounted() {
    window.addEventListener("resize", () => {
      this.calculateMaxGraphElements();
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", () => {
      this.calculateMaxGraphElements();
    });
  },
  methods: {
    updateCurrentTicker(nextTickerValue) {
      this.ticker = nextTickerValue;
    },
    calculateMaxGraphElements() {
      if (!this.$refs.graph) return;

      this.graphElementWidth = this.$refs.graph.clientWidth / this.graph.length;

      this.maxGraphElements = this.$refs.graph.clientWidth / 38;
    },
    updateTicker(tickerName, price, type) {
      this.tickers
        .filter(t => t.name === tickerName)
        .forEach(t => {
          if (t === this.selectedTicker) {
            this.graph.push(price);
          }

          while (this.graph.length > this.maxGraphElements) {
            this.graph.shift();
          }
          t.price = price;
          t.type = type;
        });
    },
    formatPrice(price) {
      if (price === "-") return price;

      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
    fetchAutocomplete() {
      this.loader = true;

      this.autocomplete = getAutocompleteList();

      setTimeout(() => {
        this.loader = false;
      }, 1500);
    },
    add(tickerName) {
      if (this.error) {
        return null;
      }
      const tickerCurrentName = tickerName.toUpperCase();

      const currentTicker = {
        name: tickerCurrentName,
        price: "-"
      };

      this.tickers = [...this.tickers, currentTicker];
      this.filter = "";
      subscribeToTicker(tickerCurrentName, (newPrice, type) => {
        this.updateTicker(tickerCurrentName, newPrice, type);
      });
    },

    handleRemove(removeTicker) {
      this.tickers = this.tickers.filter(t => t !== removeTicker);

      if (this.selectedTicker === removeTicker) {
        this.selectedTicker = null;
      }

      unsubscribeFromTicker(removeTicker.name, () => {});
    },
    selected(ticker) {
      this.selectedTicker = ticker;
    }
  }
};
</script>
