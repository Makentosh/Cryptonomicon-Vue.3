<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="addNewTicker"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <!--    //автокомплит-->
        <div
          v-if="filteredAutocomplete"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="tik in filteredAutocomplete"
            :key="tik"
            @click="addNewTicker(tik)"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ tik }}
          </span>
        </div>

        <div v-if="error" class="my-4 text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button @click="add" :disabled="disabled" />
  </section>
</template>

<script>
import AddButton from "@/components/AddButton";

export default {
  name: "AddTicker",
  components: { AddButton },
  props: {
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    error: {
      type: Boolean,
      default: false,
      required: false
    },
    filteredAutocomplete: {
      type: Array,
      required: false
    }
  },

  emits: {
    "add-ticker": value => typeof value === "string",
    "input-ticker": value => typeof value === "string"
  },
  data() {
    return {
      ticker: ""
    };
  },

  watch: {
    ticker() {
      this.$emit("input-ticker", this.ticker.toUpperCase());
    }
  },
  methods: {
    addNewTicker(tickerName) {
      if (this.ticker.length === 0) {
        return null;
      }
      this.$emit("add-ticker", tickerName ? tickerName : this.ticker);
      this.ticker = "";
    }
  }
};
</script>

<style scoped></style>
