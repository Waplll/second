let eventBus = new Vue();
Vue.component('note-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        column: {
            type: Number,
            required: true
        }
    },
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <ul>
                <li v-for="(item, index) in card.items" :key="index">
                    <input type="checkbox" v-model="item.completed" @change="updateCompletion">
                    <span :class="{ 'completed': item.completed }">{{ item.text }}</span>
                </li>
            </ul>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
            <button @click="editCard">Редактировать</button>
        </div>
    `,
    methods: {
        updateCompletion() {
            this.$emit('update-card', this.card, this.column);
        },
        editCard() {
            this.$emit('edit-card', this.card);
        }
    }
});