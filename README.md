# pants-template

> DEPRECATED: Please use [xin](https://github.com/xinix-technology/xin)

[![License](http://img.shields.io/badge/license-MIT-red.svg?style=flat-square)](https://github.com/xinix-technology/pants-template/blob/master/LICENSE)
[![Bower](http://img.shields.io/bower/v/xinix-technology/pants-template.svg?style=flat-square)](https://github.com/xinix-technology/pants-template)

Menambahkan fungsionalitas dari spesifikasi template yang baru dengan beberapa fitur yaitu:

- Binding template dengan data (obyek javascript)
- Auto instantiation dengan menggunakan custom element `<template is="pants-template">`
- Javascript instantiation dengan menggunakan `pants.template(template)`
- Expression dalam bentuk mustache templating

## Expression

Beberapa expression yang didukung adalah

### Binding data `{{ data.to.bind }}`

```html
<script type="text/javascript">
window.data = {
  time: new Date()
};
</script>
<template is="pants-template" bind="{{ data }}">
  <div>
    <label>Time <input type="text" value="{{ time }}"></label>
  </div>
  
  <div>
    <span>{{ time }}</span>
  </div>
</template>
```

### Each iteration `<template each="{{ arrays }}">`

```html
<script type="text/javascript">
window.data = {
  name: 'John Doe',
  points: [
    { 
      'subject': 'Math',
      'point': 90
    },
    { 
      'subject': 'English',
      'point': 60
    },
    { 
      'subject': 'Physics',
      'point': 100
    }
  ]
};
</script>
<template is="pants-template" bind="{{ data }}">
  <h2>{{ name }}</h2>
  <ul class="points">
    <template each="{{ points }}">
      <li>{{ subject }} = {{ point }}</li>
    </template>
  </ul>
</template>
```

### Each iteration `<template each="{{ arrays }}">`

TBD

### Render if not empty `<template if="{{ isOK }}">`

TBD

### Render on shadow dom `<template shadow">`

TBD

