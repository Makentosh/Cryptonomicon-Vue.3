<template>
  <button
    :disabled="disabled"
    type="button"
    :class="{
      'opacity-50': disabled
    }"
    class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
  >
    <plus-sign-icon />
    Добавить
  </button>
</template>

<script>
import PlusSignIcon from "@/components/PlusSignIcon";

export default {
  name: "AddButton",
  components: { PlusSignIcon },
  props: {
    disabled: {
      type: Boolean,
      default: false,
      required: false
    }
  }
};
</script>

<style scoped></style>
