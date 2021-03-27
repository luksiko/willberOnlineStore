const mySwiper = new Swiper('.swiper-container', {
    loop: true,
    // Navigation arrows
    navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev',
    },
});

// cart
const buttonCart = document.querySelector('.button-cart');
const modalCart = document.querySelector('#modal-cart');
const modalClose = document.querySelector('.modal-close');
const viewAll = document.querySelectorAll('.view-all')
const navigationLink = document.querySelectorAll('.navigation-link:not(.view-all)')
const longGoodsList = document.querySelector('.long-goods-list')
const showAccessories = document.querySelectorAll('.show-clothing')
const showClothing = document.querySelectorAll('.show-accessories')
const cardTableGoods = document.querySelector('.cart-table__goods')
const cardTableTotal = document.querySelector('.card-table__total')
const cartTotalCount = document.querySelector('.cart-count')
const btnDanger = document.querySelector('.btn-danger')
const modalForm = document.querySelector('.modal-form')

const checkGoods = () => {
    const data = []

    return async () => {
        if (data.length) return data;

        const result = await fetch('db/db.json')
        if (!result.ok) throw 'Ошибка: ' + result.status

        data.push(...(await result.json()));

        return data
    }
}
const getGoods = checkGoods()

const cart = {
    cartGoods: JSON.parse(localStorage.getItem('cartWilb')) || [],
    updateLocalStorage() {
        localStorage.setItem('cartWilb', JSON.stringify(this.cartGoods))
    },
    getCountCart() {
        return this.cartGoods.length
    },
    countQuantity() {
        const count = this.cartGoods.reduce((sum, item) => {
            return sum + item.count
        }, 0)
        cartTotalCount.textContent = count ? count : ''
    },
    clearCart() {
        this.cartGoods.length = 0
        this.countQuantity();
        this.updateLocalStorage()
        this.renderCart()
    },
    renderCart() {
        cardTableGoods.textContent = '';
        this.cartGoods.forEach(({id, name, price, count}) => {
            const trGood = document.createElement('tr')
            trGood.className = 'cart-item'
            trGood.dataset.id = id;
            trGood.innerHTML = `
                <td>${name}</td>
                <td>${price}$</td>
                <td><button class="cart-btn-minus">-</button></td>
                <td>${count}</td>
                <td><button class="cart-btn-plus">+</button></td>
                <td>${price * count}$</td>
                <td><button class="cart-btn-delete">x</button></td>
            `;
            cardTableGoods.append(trGood)
        });
        // вычисления общей суммы, reduce добавляет в себя все перебираемые items
        const totalPrice = this.cartGoods.reduce((sum, item) => {
            return sum + item.price * item.count
        }, 0)
        cardTableTotal.textContent = totalPrice + '$'
    },
    deleteGoods(id) {
        this.cartGoods = this.cartGoods.filter(item => item.id !== id)
        this.renderCart()
        this.countQuantity()
        this.updateLocalStorage()
    },
    minusGood(id) {
        for (const item of this.cartGoods) {
            if (item.id === id) {
                if (item.count <= 1) {
                    this.deleteGoods(id)
                } else {
                    item.count--
                }
                break
            }
        }
        this.renderCart()
        this.updateLocalStorage()
        this.countQuantity()
    },
    plusGood(id) {
        for (const item of this.cartGoods) {
            if (item.id === id) {
                item.count++
                break
            }
        }
        this.renderCart()
        this.countQuantity()
        this.updateLocalStorage()
    },
    addCartGoods(id) {
        const goodItem = this.cartGoods.find(item => item.id === id)
        if (goodItem) {
            this.plusGood(id)
        } else {
            getGoods()
                .then(data => data.find(item => item.id === id))
                .then(({id, name, price}) => {
                    this.cartGoods.push({
                        id,
                        name,
                        price,
                        count: 1
                    });
                    this.countQuantity()
                });
        }
    },
}

btnDanger.addEventListener('click', () => cart.clearCart())


document.body.addEventListener('click', event => {
    const addToCart = event.target.closest('.add-to-cart')
    if (addToCart) {
        cart.addCartGoods(addToCart.dataset.id)
    }
})

cardTableGoods.addEventListener('click', event => {
    const target = event.target

    if (target.tagName === 'BUTTON') {
        const id = target.closest('.cart-item').dataset.id
        if (target.classList.contains('cart-btn-delete')) {
            cart.deleteGoods(id)
        }
        if (target.classList.contains('cart-btn-minus')) {
            cart.minusGood(id)
        }
        if (target.classList.contains('cart-btn-plus')) {
            cart.plusGood(id)
        }
    }

})

const openModal = () => {
    cart.renderCart()
    modalCart.classList.add('show')
}
const closeModal = () => modalCart.classList.remove('show')

buttonCart.addEventListener('click', openModal)
modalCart.addEventListener('click', (event) => {
    const target = event.target
    if (target === modalCart || target === modalClose) {
        closeModal()
    }
})

// scroll smooth
{
    const scrollLinks = document.querySelectorAll('a.scroll-link')

    for (const scrollLink of scrollLinks) {
        scrollLink.addEventListener('click', event => {
            event.preventDefault()
            const id = scrollLink.getAttribute('href')
            document.querySelector(id).scrollIntoView({
                behavior: "smooth",
                block: "start"
            })
        })
    }
}

// goods
const createCard = ({id, img, name, label, description, price}) => {
    const card = document.createElement('div')
    card.className = 'col-lg-3 col-sm-6'
    card.innerHTML = `
        <div class="goods-card">
             ${label ? `<span class="label">${label}</span>` : ''}
             <img src="db/${img}" alt="image: ${name}" class="goods-image">
            <h3 class="goods-title">${name}</h3>
            <p class="goods-description">${description}</p>
            <button class="button goods-card-btn add-to-cart" data-id="${id}">
                <span class="button-price">$${price}</span>
            </button>
        </div>
    `;
    return card
}

const renderCards = data => {
    longGoodsList.textContent = ''
    const cards = data.map(createCard)
    longGoodsList.append(...cards)
    document.body.classList.add('show-goods')
}

const showAll = event => {
    event.preventDefault()
    getGoods().then(renderCards)
}
viewAll.forEach(elem => {
    elem.addEventListener('click', showAll)
})

// Фильтр для меню навигации
const filterCards = (field, value) => {
    getGoods()
        .then(data => data.filter(good => good[field] === value))
        .then(renderCards);
}
navigationLink.forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault()
        const field = link.dataset.field
        const value = link.textContent
        if (!field) return
        filterCards(field, value)
    })
})

showAccessories.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault()
        filterCards('category', 'Accessories')
    })
})

showClothing.forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault()
        filterCards('category', 'Clothing')
    })
})

// отправка данных из формы на PHP
const postData = dataUser => fetch('server.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: dataUser,
})

const validForm = (formData) => {
    let valid = false
    for (const [, value] of formData) {
        if (value.trim()) {
            valid = true
        } else {
            valid = falseа
            break
        }
    }
    return valid
}

modalForm.addEventListener('submit', event => {
    event.preventDefault()

    const formData = new FormData(modalForm)

    if (validForm(formData) && cart.getCountCart()) {
        const data = {}

        for (const [name, value] of formData) {
            data[name] = value
        }

        data.cart = cart.cartGoods

        postData(JSON.stringify(data))
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status)
                }
                alert('Ваш заказ успешно отправлен. С вами свяжутся в ближайшее время')
            })
            .catch(err => {
                alert('К сожалению произошла ошибка, повторите отправку позже')
                console.log(err)
            })
            .finally(() => {
                closeModal()
                modalForm.reset()
                cart.clearCart()
                cart.countQuantity()
            })
    } else {
        !cart.getCountCart() && alert('Добавте товар в Корзину')
        !validForm(formData) && alert('Заполните поля Имя и Телефон')
    }

})