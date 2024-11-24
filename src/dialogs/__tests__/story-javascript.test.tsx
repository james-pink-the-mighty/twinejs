import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps,
	fakeStory,
	StoryInspector
} from '../../test-util';
import {StoryJavaScriptDialog} from '../story-javascript';

jest.mock('../../components/control/code-area/code-area');

const TestStoryJavaScriptDialog = () => {
	const {stories} = useStoriesContext();

	return (
		<StoryJavaScriptDialog
			collapsed={false}
			onChangeCollapsed={jest.fn()}
			onChangeHighlighted={jest.fn()}
			onChangeMaximized={jest.fn()}
			onChangeProps={jest.fn()}
			onClose={jest.fn()}
			storyId={stories[0].id}
		/>
	);
};

describe('<StoryJavaScriptDialog>', () => {
	function renderComponent(contexts?: FakeStateProviderProps) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestStoryJavaScriptDialog />
				<StoryInspector />
			</FakeStateProvider>
		);
	}

	it('displays a dialog that can be maximized', () => {
		renderComponent();
		expect(screen.getByLabelText('common.maximize')).toBeInTheDocument();
	});

	it("displays the story's JavaScript", () => {
		const story = fakeStory();

		story.script = 'mock-story-javascript';

		renderComponent({stories: [story]});

		expect(
			screen.getByLabelText('dialogs.storyJavaScript.editorLabel')
		).toHaveValue('mock-story-javascript');
	});

	it("changes the story's JavaScript as edits are made", () => {
		renderComponent();
		fireEvent.change(
			screen.getByLabelText('dialogs.storyJavaScript.editorLabel'),
			{
				target: {value: 'mock-change'}
			}
		);
		expect(
			screen.getByTestId('story-inspector-javascript-default')
		).toHaveTextContent('mock-change');
	});

	it('uses the code editor font preferences', () => {
		renderComponent({
			prefs: {
				codeEditorFontFamily: 'mock-font-family',
				codeEditorFontScale: 2,
				passageEditorFontFamily: 'incorrect-font-family',
				passageEditorFontScale: 1.75
			}
		});

		const editor = screen.getByTestId('mock-code-area');

		expect(editor.dataset.fontFamily).toBe('mock-font-family');
		expect(editor.dataset.fontScale).toBe('2');
	});

	it('sets the code area in JavaScript mode and autofocuses it', () => {
		renderComponent();
		expect(
			JSON.parse(screen.getByTestId('mock-code-area')!.dataset.options!)
		).toEqual(expect.objectContaining({autofocus: true, mode: 'javascript'}));
	});

	it('blinks the cursor if that preference is not set', () => {
		renderComponent({prefs: {editorCursorBlinks: true}});
		expect(
			JSON.parse(screen.getByTestId('mock-code-area')!.dataset.options!)
		).not.toEqual(expect.objectContaining({cursorBlinkRate: 0}));
	});

	it("doesn't blink the cursor if that preference is set", () => {
		renderComponent({prefs: {editorCursorBlinks: false}});
		expect(
			JSON.parse(screen.getByTestId('mock-code-area')!.dataset.options!)
		).toEqual(expect.objectContaining({cursorBlinkRate: 0}));
	});

	describe('When CodeMirror is enabled', () => {
		it('uses CodeMirror on its code area', () => {
			renderComponent({prefs: {useCodeMirror: true}});
			expect(screen.getByTestId('mock-code-area')!.dataset.useCodeMirror).toBe(
				'true'
			);
		});

		it('shows undo, redo, and indent buttons', () => {
			renderComponent({prefs: {useCodeMirror: true}});
			expect(
				screen.getByRole('button', {name: 'common.undo'})
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', {name: 'common.redo'})
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', {name: 'components.indentButtons.indent'})
			).toBeInTheDocument();
			expect(
				screen.getByRole('button', {
					name: 'components.indentButtons.unindent'
				})
			).toBeInTheDocument();
		});

		it.todo('indents code with its indent buttons');
		it.todo('undos and redos changes with the undo/redo buttons');
	});

	describe('When CodeMirror is disabled', () => {
		it("doesn't use CodeMirror on its code area", () => {
			renderComponent({prefs: {useCodeMirror: false}});
			expect(screen.getByTestId('mock-code-area')!.dataset.useCodeMirror).toBe(
				'false'
			);
		});

		it('hides undo, redo, and indent buttons', () => {
			renderComponent({prefs: {useCodeMirror: false}});
			expect(
				screen.queryByRole('button', {name: 'common.undo'})
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole('button', {name: 'common.redo'})
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole('button', {name: 'components.indentButtons.indent'})
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole('button', {
					name: 'components.indentButtons.unindent'
				})
			).not.toBeInTheDocument();
		});
	});

	it('is accessible', async () => {
		const {container} = renderComponent();

		expect(await axe(container)).toHaveNoViolations();
	});
});
