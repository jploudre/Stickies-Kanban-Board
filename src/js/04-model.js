

	function Note(text, color)
	{
		this.text = text;
		this.color = color || 'gray';
	}

	function List(title)
	{
		this.title = title;
		this.notes = [ ];

		this.addNote = function(text, color)
		{
			var x = new Note(text, color);
			this.notes.push(x);
			return x;
		}
	}

	function Board(title)
	{
		this.format   = SKB.blobVersion;
		this.id       = +new Date();
		this.revision = 0;
		this.title    = title || '';
		this.lists    = [ ];

		this.addList = function(title)
		{
			var x = new List(title);
			this.lists.push(x);
			return x;
		}
	}

