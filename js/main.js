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
        },
        isFirstColumnBlocked: {
            type: Boolean,
            required: true
        }
    },
    template: `
        <div class="card" :class="{ 'priority': card.priority }">
            <h3>{{ card.title }}</h3>
            <ul>
                <li v-for="(item, index) in card.items" :key="index">
                    <input
                        type="checkbox"
                        v-model="item.completed"
                        @change="updateCompletion"
                        :disabled="column === 3 || (column === 1 && isFirstColumnBlocked)"
                    >
                    <span :class="{ 'completed': item.completed }">{{ item.text }}</span>
                </li>
            </ul>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
            <button
                v-if="column !== 3 && !(column === 1 && isFirstColumnBlocked)"
                @click="editCard"
            >
                Редактировать
            </button>
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

let app = new Vue({
    el: '#app',
    data: {
        cards: [],
        nextCardId: 1,
        isFirstColumnBlocked: false,
        newCardTitle: '',
        newCardItems: ['', '', ''],
        editingCard: null,
        isPriority: false// Флаг
    },
    computed: {
        firstColumnCards() {
            return this.cards
                .filter(card => card.column === 1)
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        },
        secondColumnCards() {
            return this.cards
                .filter(card => card.column === 2)
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));
        },
        thirdColumnCards() {
            return this.cards.filter(card => card.column === 3);
        },
        isNewCardValid() {
            return this.newCardTitle.trim() !== '' &&
                this.newCardItems.length >= 3 &&
                this.newCardItems.length <= 5 &&
                this.newCardItems.every(item => item.trim() !== '');
        }
    },
    methods: {
        addCard(title, items, priority = false) {
            if (this.firstColumnCards.length >= 3) {
                alert('Нельзя добавить больше 3 карточек в первый столбец');
                return;
            }
            const newCard = {
                id: this.nextCardId++,
                title: title,
                items: items.map(text => ({ text: text, completed: false })),
                column: 1,
                completedDate: null,
                priority: priority
            };
            this.cards.push(newCard);
            this.saveData();
        },
        createCard() {
            if (this.isNewCardValid) {
                this.addCard(this.newCardTitle, this.newCardItems, this.isPriority);
                this.newCardTitle = '';
                this.newCardItems = ['', '', ''];
                this.isPriority = false;
            }
        },
        addNewCardItem() {
            if (this.newCardItems.length < 5) {
                this.newCardItems.push('');
            }
        },
        removeNewCardItem(index) {
            this.newCardItems.splice(index, 1);
        },
        updateCard(card, column) {
            const completedItems = card.items.filter(item => item.completed).length;
            const totalItems = card.items.length;
            const completionPercentage = (completedItems / totalItems) * 100;

            if (column === 1) {
                if (completionPercentage > 50) {
                    if (this.secondColumnCards.length < 5) {
                        card.column = 2;
                    } else {
                        this.checkFirstColumnLock(true);
                    }
                }
            } else if (column === 2) {
                if (completionPercentage <= 50) {
                    if (this.firstColumnCards.length < 3) {
                        card.column = 1;
                        this.checkFirstColumnLock(false);
                    } else {
                        alert('Первый столбец полон, невозможно переместить карточку обратно.');
                    }
                } else if (completionPercentage === 100) {
                    card.column = 3;
                    card.completedDate = new Date().toLocaleString();
                    this.checkFirstColumnLock(false);
                }
            }
            this.saveData();
        },
        checkFirstColumnLock(forceBlock = false) {
            if (forceBlock || this.secondColumnCards.length >= 5) {
                const hasOver50Percent = this.firstColumnCards.some(card => {
                    const completedItems = card.items.filter(item => item.completed).length;
                    const totalItems = card.items.length;
                    return (completedItems / totalItems) * 100 > 50;
                });
                this.isFirstColumnBlocked = hasOver50Percent || forceBlock;
            } else {
                this.isFirstColumnBlocked = false;
            }
        },
        editCard(card) {
            if (!this.isFirstColumnBlocked || card.column !== 1) {
                this.editingCard = JSON.parse(JSON.stringify(card));
            } else {
                alert('Редактирование карточек в первом столбце заблокировано из-за переполнения второго столбца.');
            }
        },
        saveEditedCard() {
            const index = this.cards.findIndex(c => c.id === this.editingCard.id);
            if (index !== -1) {
                this.cards.splice(index, 1, this.editingCard);
            }
            this.editingCard = null;
            this.saveData();
        },
        cancelEdit() {
            this.editingCard = null;
        },
        addEditCardItem() {
            if (this.editingCard.items.length < 5) {
                this.editingCard.items.push({ text: '', completed: false });
            }
        },
        removeEditCardItem(index) {
            if (this.editingCard.items.length > 3) {
                this.editingCard.items.splice(index, 1);
            } else {
                alert('Нельзя удалить пункт, так как должно быть не менее трех пунктов.');
            }
        },
        deleteAllCards() {
            this.cards = [];
            this.nextCardId = 1;
            this.saveData();
        },
        saveData() {
            localStorage.setItem('cards', JSON.stringify(this.cards));
            localStorage.setItem('nextCardId', this.nextCardId);
        },
        loadData() {
            const savedCards = localStorage.getItem('cards');
            const savedNextCardId = localStorage.getItem('nextCardId');
            if (savedCards) {
                this.cards = JSON.parse(savedCards);
            }
            if (savedNextCardId) {
                this.nextCardId = parseInt(savedNextCardId, 10);
            }
            this.checkFirstColumnLock();
        }
    },
    mounted() {
        this.loadData();
    }
});