class Model {
	constructor() {
		this.todos = JSON.parse(localStorage.getItem('todos')) || []
	}

	bindTodoListChanged(callback) {
		this.onTodoListChanged = callback
	}

	_commit(todos) {
		this.onTodoListChanged(todos)
		localStorage.setItem('todos', JSON.stringify(todos))
	}

	addTodo(todoText) {
		const todo = {
			id: this.todos.length > 0 ? this.todos[this.todos.length - 1].id + 1 : 1,
			text: todoText,
			complete: false,
		}

		this.todos.push(todo)
		this._commit(this.todos)
	}

	editTodo(id, updatedText) {
		this.todos = this.todos.map((todo) =>
			todo.id === id
				? { id: todo.id, text: updatedText, complete: todo.complete }
				: todo
		)
		this._commit(this.todos)
	}

	deleteTodo(id) {
		this.todos = this.todos.filter((todo) => todo.id !== id)
		this._commit(this.todos)
	}

	toggleTodo(id) {
		this.todos = this.todos.map((todo) =>
			todo.id === id
				? { id: todo.id, text: todo.text, complete: !todo.complete }
				: todo
		)
		this._commit(this.todos)
	}
}

class View {
	constructor() {
		//The root element
		this.app = this.getElement('#root')

		//The title of the app
		this.title = this.createElement('h1')
		this.title.textContent = 'Todos'

		// The form, with a [type="text"] input, and a submit button
		this.form = this.createElement('form')

		this.input = this.createElement('input')
		this.input.type = 'text'
		this.input.placeholder = 'Add todo'
		this.input.name = 'todo'

		this.submitButton = this.createElement('button')
		this.submitButton.textContent = 'Submit'

		// The visual representation of the todo list
		this.todoList = this.createElement('ul', 'todo-list')

		// Append the input and submit button to the form
		this.form.append(this.input, this.submitButton)

		// Append the title, form and todo list to the app
		this.app.append(this.title, this.form, this.todoList)

		this._temporaryTodoText
		this._initLocalListeners()
	}

	// Update temporary state
	_initLocalListeners() {
		this.todoList.addEventListener('input', (e) => {
			if (e.target.className === 'editable') {
				this._temporaryTodoText = e.target.innerText
			}
		})
	}

	// Send the completed value to the model
	bindEditTodo(handler) {
		this.todoList.addEventListener('focusout', (e) => {
			if (this._temporaryTodoText) {
				const id = parseInt(e.target.parentElement.id)

				handler(id, this._temporaryTodoText)
				this._temporaryTodoText = ''
			}
		})
	}

	get _todoText() {
		return this.input.value
	}

	_resetInput() {
		this.input.value = ''
	}

	createElement(tag, className) {
		const element = document.createElement(tag)
		if (className) element.classList.add(className)

		return element
	}

	getElement(selector) {
		const element = document.querySelector(selector)
		return element
	}

	// Delete all nodes
	displayTodos(todos) {
		while (this.todoList.firstChild) {
			this.todoList.removeChild(this.todoList.firstChild)
		}

		// Show default message
		if (todos.length === 0) {
			const p = this.createElement('p')
			p.textContent = 'Nothing to do! Add a task?'
			this.todoList.append(p)
		} else {
			// Create todo item nodes for each todo in state
			todos.forEach((todo) => {
				const li = this.createElement('li')
				li.id = todo.id

				// Each todo item will have a checkbox you can toggle
				const checkbox = this.createElement('input')
				checkbox.type = 'checkbox'
				checkbox.checked = todo.complete

				// The todo item text will be in a contenteditable span
				const span = this.createElement('span')
				span.contenteditable = true
				span.classList.add('editable')

				// If the todo is complete, it will have a strikethrough
				if (todo.complete) {
					const strike = this.createElement('s')
					strike.textContent = todo.text
					span.append(strike)
				} else {
					// Otherwise just display the text
					span.textContent = todo.text
				}

				// The todos will also have a delete button
				const deleteButton = this.createElement('button', 'delete')
				deleteButton.textContent = 'Delete'
				li.append(checkbox, span, deleteButton)

				// Append nodes to the todo list
				this.todoList.append(li)
			})
		}
	}

	bindAddTodo(handler) {
		this.form.addEventListener('submit', (e) => {
			e.preventDefault()

			if (this._todoText) {
				handler(this._todoText)
				this._resetInput()
			}
		})
	}

	bindDeleteTodo(handler) {
		this.todoList.addEventListener('click', (e) => {
			if (e.target.className === 'delete') {
				const id = parseInt(e.target.parentElement.id)
				handler(id)
			}
		})
	}

	bindToggleTodo(handler) {
		this.todoList.addEventListener('change', (e) => {
			if (e.target.type === 'checkbox') {
				const id = parseInt(e.target.parentElement.id)
				handler(id)
			}
		})
	}
}

class Controller {
	constructor(model, view) {
		this.model = model
		this.view = view

		// Explicit this binding
		this.view.bindAddTodo(this.handleAddTodo)
		this.view.bindDeleteTodo(this.handleDeleteTodo)
		this.view.bindToggleTodo(this.handleToggleTodo)
		this.model.bindTodoListChanged(this.onTodoListChanged)
		this.view.bindEditTodo(this.handleEditTodo)

		// Display initial todos
		this.onTodoListChanged(this.model.todos)
	}

	onTodoListChanged = (todos) => {
		this.view.displayTodos(todos)
	}

	handleAddTodo = (todoText) => {
		this.model.addTodo(todoText)
	}

	handleEditTodo = (id, todoText) => {
		this.model.editTodo(id, todoText)
	}

	handleDeleteTodo = (id) => {
		this.model.deleteTodo(id)
	}

	handleToggleTodo = (id) => {
		this.model.toggleTodo(id)
	}
}

const app = new Controller(new Model(), new View())
