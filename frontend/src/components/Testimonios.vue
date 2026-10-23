<template>
  <section class="seccion-testimonios">
    <div class="container">
      <span class="eyebrow">Opiniones</span>
      <h2 class="section-title">Lo que dicen <em class="acento">nuestros clientes</em></h2>
      <p class="section-subtitle">Cada pedido es especial, y nos encanta saber qué les pareció.</p>

      <div v-if="testimonios.length" class="mb-4">
        <div id="carruselTestimonios" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
          <div class="carousel-inner">
            <div
              v-for="(grupo, index) in grupos"
              :key="index"
              class="carousel-item"
              :class="{ active: index === 0 }"
            >
              <div class="row g-4">
                <div class="col-12 col-md-4" v-for="(t, i) in grupo" :key="t.Id">
                  <figure class="testimonio-card h-100">
                    <span class="comillas" aria-hidden="true">“</span>
                    <div class="estrellas" :aria-label="`${t.Calificacion} de 5 estrellas`">
                      <i class="bi bi-star-fill" v-for="n in t.Calificacion" :key="n" aria-hidden="true"></i>
                      <i class="bi bi-star" v-for="n in (5 - t.Calificacion)" :key="'v' + n" aria-hidden="true"></i>
                    </div>
                    <blockquote class="testimonio-texto">{{ t.Comentario }}</blockquote>
                    <figcaption class="d-flex align-items-center gap-2">
                      <span class="avatar" :data-i="i">{{ t.Nombre?.charAt(0).toUpperCase() }}</span>
                      <span class="testimonio-nombre">{{ t.Nombre }}</span>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="grupos.length > 1" class="d-flex justify-content-center gap-2 mt-3">
          <span
            v-for="(g, i) in grupos"
            :key="i"
            class="dot-testimonios"
            :class="{ activo: i === indiceActual }"
          ></span>
        </div>
      </div>

      <p v-else class="text-secondary text-center mb-4">Todavía no hay opiniones — ¡sé el primero en dejar la tuya!</p>

      <div class="row justify-content-center">
        <div class="col-12">
          <div v-if="auth.estaLogueado" class="opinion-card p-4">
            <h3 class="opinion-titulo">{{ miTestimonio ? 'Editar mi opinión' : 'Dejá tu opinión' }}</h3>

            <div class="mb-2 estrellas-input">
              <i
                v-for="n in 5"
                :key="n"
                class="bi"
                :class="n <= form.calificacion ? 'bi-star-fill' : 'bi-star'"
                @click="form.calificacion = n"
              ></i>
            </div>

              <textarea v-model="form.comentario" class="form-control mb-1" rows="3" maxlength="100" placeholder="Contanos tu experiencia..."></textarea>
              <p class="text-secondary small text-end mb-3">{{ form.comentario.length }}/100</p>

            <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

            <button class="btn btn-turquesa" @click="enviar" :disabled="enviando">
              {{ enviando ? 'Guardando...' : (miTestimonio ? 'Actualizar opinión' : 'Publicar opinión') }}
            </button>
          </div>

          <p v-else class="text-center">
            <router-link to="/login">Iniciá sesión</router-link> para dejar tu opinión.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const testimonios = ref([])
const miTestimonio = ref(null)
const form = ref({ comentario: '', calificacion: 5 })
const enviando = ref(false)
const error = ref('')
const indiceActual = ref(0)


onMounted(async () => {
  await cargarTestimonios()

  if (auth.estaLogueado) {
    const { data } = await api.get('/testimonios/mio')
    if (data) {
      miTestimonio.value = data
      form.value = { comentario: data.Comentario, calificacion: data.Calificacion }
    }
  }

  await nextTick()
  const carrusel = document.getElementById('carruselTestimonios')
  if (carrusel) {
    window.bootstrap.Carousel.getOrCreateInstance(carrusel, { interval: 5000, ride: true, wrap: true })
    carrusel.addEventListener('slid.bs.carousel', (e) => {
      indiceActual.value = e.to
    })
  }
})

async function cargarTestimonios() {
  const { data } = await api.get('/testimonios')
  testimonios.value = data
}

// Agrupa los testimonios de a 3 (como se ven en una fila) para el carrusel
const grupos = computed(() => {
  const resultado = []
  for (let i = 0; i < testimonios.value.length; i += 3) {
    resultado.push(testimonios.value.slice(i, i + 3))
  }
  return resultado
})

async function enviar() {
  error.value = ''

  if (!form.value.comentario || form.value.comentario.trim().length < 5) {
    error.value = 'Escribí un comentario un poco más largo'
    return
  }

  enviando.value = true
  try {
    await api.post('/testimonios', form.value)
    await cargarTestimonios()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar tu opinión'
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.seccion-testimonios {
  padding: 88px 0;
  background: var(--blanco);
}
.acento {
  color: var(--rosa-viejo);
  font-style: italic;
}
.testimonio-card {
  position: relative;
  margin: 0;
  background: var(--crema);
  border-radius: var(--radio-grande);
  padding: 32px 28px 26px;
  display: flex;
  flex-direction: column;
}
.comillas {
  position: absolute;
  top: 6px;
  right: 22px;
  font-family: var(--fuente-titulos);
  font-size: 5rem;
  line-height: 1;
  color: var(--rosa-polvo-medio);
}
.estrellas {
  margin-bottom: 14px;
}
.estrellas i {
  color: var(--rosa-viejo);
  font-size: 0.9rem;
  margin-right: 2px;
}
.testimonio-texto {
  font-family: var(--fuente-titulos);
  font-size: 1.12rem;
  line-height: 1.5;
  color: var(--ciruela);
  margin: 0 0 22px;
  flex: 1;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--rosa-polvo);
  color: var(--rosa-texto);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.testimonio-nombre {
  font-weight: 500;
  font-size: 0.95rem;
}
.dot-testimonios {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--rosa-polvo-medio);
  transition: width 0.25s, background-color 0.25s;
}
.dot-testimonios.activo {
  background: var(--rosa-viejo);
  width: 24px;
}
.opinion-card {
  background: var(--crema);
  border: 1px dashed var(--rosa-polvo-medio);
  border-radius: var(--radio-grande);
  max-width: 640px;
  margin: 24px auto 0;
}
.opinion-titulo {
  font-size: 1.3rem;
  margin-bottom: 12px;
}
.estrellas-input i {
  font-size: 1.5rem;
  color: var(--rosa-viejo);
  cursor: pointer;
  margin-right: 4px;
}
</style>
