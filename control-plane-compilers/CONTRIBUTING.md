# Contributing to One2lv Control Plane Compilers

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🎯 How to Contribute

### 1. Reporting Issues

- **Bug Reports**: Use GitHub Issues with clear reproduction steps
- **Feature Requests**: Describe the use case and potential benefits
- **Questions**: Use GitHub Discussions for general questions

### 2. Code Contributions

#### Getting Started
```bash
# Clone the repository
git clone https://github.com/one2lv-com/control-plane-compilers.git
cd control-plane-compilers

# Install development dependencies
pip install -r lib/dev_requirements.txt
```

#### Development Workflow
1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project style

3. **Run tests**:
   ```bash
   python -m pytest tests/
   ```

4. **Format code**:
   ```bash
   black src/ tests/ examples/
   ```

5. **Type check**:
   ```bash
   mypy src/
   ```

6. **Commit changes**:
   ```bash
   git commit -m "feat: add your feature description"
   ```

7. **Push and create Pull Request**

#### Code Style
- Follow PEP 8 guidelines
- Use type hints where possible
- Write docstrings for all public functions
- Keep functions focused and concise

### 3. Documentation

- Update relevant documentation when adding features
- Add examples for new functionality
- Keep README up to date

## 📋 Pull Request Process

1. Ensure all tests pass
2. Update documentation as needed
3. Add entry to CHANGELOG.md
4. Reference any related issues
5. Request review from maintainers

## 🎨 Commit Message Format

We follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `chore:` Build/tooling changes

## 📞 Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and community support
- Email: dev@one2lv.io

## 📜 Code of Conduct

Be respectful, constructive, and professional in all interactions.

Thank you for contributing!
