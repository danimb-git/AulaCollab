<template>
  <!-- Menú lateral esquerre -->
  <aside class="drawer drawer-left">
    <h2 class="drawer-title">Menú</h2>

    <!-- Secció Classes (sempre) -->
    <div class="drawer-section-title">Classes</div>

    <!-- Llistem totes les classes -->
    <div
      v-for="c in classes"
      :key="c.id"
      class="drawer-item"
      @click="emitGoClass(c.id)"
    >
      {{ c.name }}
    </div>

    <!-- Secció Grups (només si showGroups = true) -->
    <template v-if="showGroups">
      <div class="drawer-section-title">Grups d’estudi</div>

      <div
        v-for="g in groups"
        :key="g.id"
        class="drawer-item"
        @click="emitGoGroup(g.id)"
      >
        {{ g.name }}
      </div>
    </template>
  </aside>
</template>

<script setup>
/**
 * LeftDrawer.vue
 * Menú lateral esquerre que mostra:
 *  - Classes
 *  - (Opcionalment) Grups d'estudi
 *
 * Aquest component només mostra informació.
 * No fa router.push aquí: quan cliques, emet un event.
 */

defineProps({
  classes: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },

  // Si true: mostra grups (alumne). Si false: no (professor).
  showGroups: { type: Boolean, default: true },
});

const emit = defineEmits(["go-class", "go-group"]);

function emitGoClass(classId) {
  emit("go-class", classId);
}

function emitGoGroup(groupId) {
  emit("go-group", groupId);
}
</script>
